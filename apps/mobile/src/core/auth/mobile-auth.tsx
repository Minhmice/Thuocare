import {
  bootstrapSelfServePatientAccount,
  buildRequestActorContext,
  claimPatientAccount,
  patientClaimFailureAllowsSelfServeBootstrap,
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
} from "@/core/supabase/mobile-client";

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
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshActor: (options?: { forceProvision?: boolean }) => Promise<void>;
}

interface PendingClaimResolutionResult {
  actor: AnyActorContext;
  errorMessage: string | null;
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
  const actorRef = useRef<AnyActorContext | null>(null);
  const autoProvisionAttemptedUserIdRef = useRef<string | null>(null);
  const refreshActorInFlightRef = useRef(false);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const resolvePendingPatientClaim = useCallback(
    async (
      currentActor: AnyActorContext,
      options?: { force?: boolean },
    ): Promise<PendingClaimResolutionResult> => {
      if (currentActor.kind !== "unresolved" || currentActor.bindingState !== "pending_claim") {
        return { actor: currentActor, errorMessage: null };
      }

      const authUserId = currentActor.authUserId;
      if (!options?.force && autoProvisionAttemptedUserIdRef.current === authUserId) {
        return { actor: currentActor, errorMessage: null };
      }

      autoProvisionAttemptedUserIdRef.current = authUserId;
      authDebugLog("actor", "self_serve_provision_start", {
        authUserId,
        trigger: options?.force ? "manual_refresh" : "auto",
      });

      try {
        const claimResult = await claimPatientAccount(mobileSupabase, null);

        if (!claimResult.success) {
          if (patientClaimFailureAllowsSelfServeBootstrap(claimResult)) {
            const bootstrapResult = await bootstrapSelfServePatientAccount(mobileSupabase, "personal");
            if (!bootstrapResult.success) {
              authDebugLog("actor", "self_serve_bootstrap_failed", {
                authUserId,
                message: bootstrapResult.error,
              });
              return { actor: currentActor, errorMessage: bootstrapResult.error };
            }
          } else {
            authDebugLog("actor", "self_serve_claim_failed", {
              authUserId,
              message: claimResult.error,
            });
            return { actor: currentActor, errorMessage: claimResult.error };
          }
        }

        const resolvedActor = await buildRequestActorContext(mobileSupabase);
        authDebugLog("actor", "self_serve_provision_success", {
          authUserId,
          actorKind: resolvedActor.kind,
        });
        return { actor: resolvedActor, errorMessage: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to complete account setup";
        authDebugLog("actor", "self_serve_provision_exception", {
          authUserId,
          message,
        });
        return { actor: currentActor, errorMessage: message };
      }
    },
    [],
  );

  const resolveActor = useCallback(async (nextSession: Session | null) => {
    const runId = ++actorResolutionRunRef.current;
    authDebugLog("actor", "resolution_start", { runId, ...getSessionSummary(nextSession) });

    if (!nextSession) {
      autoProvisionAttemptedUserIdRef.current = null;
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
      const pendingClaimResolution = await resolvePendingPatientClaim(nextActor);
      if (runId !== actorResolutionRunRef.current) {
        authDebugLog("actor", "resolution_stale_result", { runId });
        return;
      }
      setActor(pendingClaimResolution.actor);
      setActorStatus("ready");
      setActorError(pendingClaimResolution.errorMessage);
      authDebugLog("actor", "resolution_success", {
        runId,
        actorKind: pendingClaimResolution.actor.kind,
        hasError: pendingClaimResolution.errorMessage !== null,
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
  }, [resolvePendingPatientClaim]);

  useEffect(() => {
    let isMounted = true;
    authDebugLog("auth", "bootstrap_start");
    const stopAutoRefresh = bindMobileSupabaseAutoRefresh();
    const {
      data: { subscription },
    } = mobileSupabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      authDebugLog("auth", "auth_state_change", {
        event,
        ...getSessionSummary(nextSession),
      });
      setSession(nextSession);

      // Cold start: Supabase emits INITIAL_SESSION as soon as the listener is
      // registered; our bootstrap() also calls getSession() + resolveActor().
      // Running both in parallel can fire RPC before the JS client attaches the
      // access token to PostgREST requests → empty binding → kind "unresolved".
      // Bootstrap is the single source of truth for the first resolve.
      if (event === "INITIAL_SESSION") {
        authDebugLog("actor", "resolve_deferred_to_bootstrap", getSessionSummary(nextSession));
        return;
      }

      const uid = nextSession?.user?.id ?? null;
      if (event === "TOKEN_REFRESHED" && uid) {
        const current = actorRef.current;
        if (current !== null && current.authUserId === uid) {
          authDebugLog("actor", "resolve_skipped_token_refresh", {
            authUserId: uid,
            actorKind: current.kind,
          });
          return;
        }
      }

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

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    const metadata = {
      full_name: fullName.trim(),
      actor_type: "patient",
      care_intent: "personal",
    };

    const { data, error } = await mobileSupabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw error;
    }

    return {
      needsEmailConfirmation: data.session == null,
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await mobileSupabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const refreshActor = useCallback(async (options?: { forceProvision?: boolean }) => {
    if (refreshActorInFlightRef.current) {
      authDebugLog("actor", "refresh_skipped_in_flight");
      return;
    }
    refreshActorInFlightRef.current = true;
    authDebugLog("actor", "refresh_requested");
    setActorStatus("loading");
    setActorError(null);
    try {
      const refreshed = await resolveActorFromCurrentSession();
      if (!refreshed) {
        autoProvisionAttemptedUserIdRef.current = null;
        setActor(null);
        setActorStatus("idle");
        setActorError(null);
        authDebugLog("actor", "refresh_success", {
          hasActor: false,
          actorKind: null,
        });
        return;
      }

      const pendingClaimResolution = await resolvePendingPatientClaim(refreshed, {
        force: options?.forceProvision === true,
      });
      setActor(pendingClaimResolution.actor);
      setActorStatus("ready");
      setActorError(pendingClaimResolution.errorMessage);
      authDebugLog("actor", "refresh_success", {
        hasActor: true,
        actorKind: pendingClaimResolution.actor.kind,
        hasError: pendingClaimResolution.errorMessage !== null,
      });
    } catch (error) {
      setActor(null);
      setActorStatus("error");
      setActorError(error instanceof Error ? error.message : "Failed to resolve actor context");
      authDebugLog("actor", "refresh_failure", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
    } finally {
      refreshActorInFlightRef.current = false;
    }
  }, [resolvePendingPatientClaim]);

  const value = useMemo<MobileAuthContextValue>(
    () => ({
      bootstrapStatus,
      actorStatus,
      session,
      user: session?.user ?? null,
      actor,
      actorError,
      signIn,
      signUp,
      signOut,
      refreshActor,
    }),
    [actor, actorError, actorStatus, bootstrapStatus, refreshActor, session, signIn, signOut, signUp],
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
