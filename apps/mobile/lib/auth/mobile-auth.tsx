import {
  buildRequestActorContext,
  type AnyActorContext,
} from "@thuocare/auth";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  bindMobileSupabaseAutoRefresh,
  mobileSupabase,
} from "@/lib/supabase/mobile-client";

const AUTH_DEBUG_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_DEBUG_AUTH === "1" || process.env.EXPO_PUBLIC_DEBUG_AUTH === "true";

function authDebugLog(tag: "auth" | "session" | "actor", event: string, details?: Record<string, unknown>) {
  if (!AUTH_DEBUG_ENABLED) return;
  console.info(`[${tag}] ${event}`, details ?? {});
}

function getSessionSummary(nextSession: Session | null) {
  return {
    hasSession: nextSession !== null,
    hasUser: nextSession?.user != null,
    userIdPresent: Boolean(nextSession?.user?.id),
  };
}

type AuthBootstrapStatus = "loading" | "ready";
type ActorResolutionStatus = "idle" | "loading" | "ready" | "error";

interface MobileAuthContextValue {
  bootstrapStatus: AuthBootstrapStatus;
  actorStatus: ActorResolutionStatus;
  session: Session | null;
  user: User | null;
  actor: AnyActorContext | null;
  actorError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshActor: () => Promise<void>;
}

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

async function resolveActorFromCurrentSession(): Promise<AnyActorContext | null> {
  const {
    data: { session: currentSession },
  } = await mobileSupabase.auth.getSession();

  if (!currentSession) {
    return null;
  }

  return buildRequestActorContext(mobileSupabase);
}

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [bootstrapStatus, setBootstrapStatus] = useState<AuthBootstrapStatus>("loading");
  const [actorStatus, setActorStatus] = useState<ActorResolutionStatus>("idle");
  const [session, setSession] = useState<Session | null>(null);
  const [actor, setActor] = useState<AnyActorContext | null>(null);
  const [actorError, setActorError] = useState<string | null>(null);
  const actorResolutionRunRef = useRef(0);

  const resolveActor = useCallback(async (nextSession: Session | null) => {
    const runId = ++actorResolutionRunRef.current;
    authDebugLog("actor", "resolution_start", { runId, ...getSessionSummary(nextSession) });

    if (!nextSession) {
      setActor(null);
      setActorStatus("idle");
      setActorError(null);
      authDebugLog("actor", "resolution_skipped_no_session", { runId });
      return;
    }

    setActorStatus("loading");
    setActorError(null);
    try {
      const nextActor = await buildRequestActorContext(mobileSupabase);
      if (runId !== actorResolutionRunRef.current) {
        authDebugLog("actor", "resolution_stale_result", { runId });
        return;
      }
      setActor(nextActor);
      setActorStatus("ready");
      authDebugLog("actor", "resolution_success", {
        runId,
        actorKind: nextActor?.kind ?? "unknown",
      });
    } catch (error) {
      if (runId !== actorResolutionRunRef.current) {
        authDebugLog("actor", "resolution_stale_error", { runId });
        return;
      }
      setActor(null);
      setActorStatus("error");
      setActorError(error instanceof Error ? error.message : "Failed to resolve actor context");
      authDebugLog("actor", "resolution_failure", {
        runId,
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authDebugLog("auth", "bootstrap_start");
    const stopAutoRefresh = bindMobileSupabaseAutoRefresh();
    const {
      data: { subscription },
    } = mobileSupabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      authDebugLog("auth", "auth_state_change", getSessionSummary(nextSession));
      setSession(nextSession);
      void resolveActor(nextSession);
    });

    const bootstrap = async () => {
      let bootstrapFailed = false;
      try {
        authDebugLog("session", "restore_attempt");
        const {
          data: { session: restoredSession },
          error,
        } = await mobileSupabase.auth.getSession();

        if (!isMounted) return;
        if (error) {
          bootstrapFailed = true;
          authDebugLog("session", "restore_failure", { message: error.message });
          setSession(null);
          await resolveActor(null);
          return;
        }

        authDebugLog("session", "restore_success", getSessionSummary(restoredSession));
        setSession(restoredSession);
        await resolveActor(restoredSession);
      } catch {
        bootstrapFailed = true;
        if (!isMounted) return;
        authDebugLog("session", "restore_failure", { message: "unexpected_exception" });
        setSession(null);
        await resolveActor(null);
      } finally {
        if (isMounted) {
          setBootstrapStatus("ready");
          if (bootstrapFailed) {
            authDebugLog("auth", "bootstrap_failure");
          } else {
            authDebugLog("auth", "bootstrap_success");
          }
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      authDebugLog("auth", "bootstrap_cleanup");
      subscription.unsubscribe();
      stopAutoRefresh();
    };
  }, [resolveActor]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await mobileSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await mobileSupabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const refreshActor = useCallback(async () => {
    authDebugLog("actor", "refresh_requested");
    setActorStatus("loading");
    setActorError(null);
    try {
      const refreshed = await resolveActorFromCurrentSession();
      setActor(refreshed);
      setActorStatus(refreshed ? "ready" : "idle");
      authDebugLog("actor", "refresh_success", { hasActor: refreshed !== null });
    } catch (error) {
      setActor(null);
      setActorStatus("error");
      setActorError(error instanceof Error ? error.message : "Failed to resolve actor context");
      authDebugLog("actor", "refresh_failure", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }, []);

  const value = useMemo<MobileAuthContextValue>(
    () => ({
      bootstrapStatus,
      actorStatus,
      session,
      user: session?.user ?? null,
      actor,
      actorError,
      signIn,
      signOut,
      refreshActor,
    }),
    [actor, actorError, actorStatus, bootstrapStatus, refreshActor, session, signIn, signOut],
  );

  return <MobileAuthContext.Provider value={value}>{children}</MobileAuthContext.Provider>;
}

export function useMobileAuth() {
  const context = useContext(MobileAuthContext);
  if (!context) {
    throw new Error("useMobileAuth must be used within MobileAuthProvider");
  }
  return context;
}
