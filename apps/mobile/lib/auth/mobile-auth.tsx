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
  useState,
  type ReactNode,
} from "react";

import {
  bindMobileSupabaseAutoRefresh,
  mobileSupabase,
} from "@/lib/supabase/mobile-client";

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
    data: { session },
  } = await mobileSupabase.auth.getSession();

  if (!session) {
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

  const resolveActor = useCallback(async (nextSession: Session | null) => {
    if (!nextSession) {
      setActor(null);
      setActorStatus("idle");
      setActorError(null);
      return;
    }

    setActorStatus("loading");
    setActorError(null);
    try {
      const nextActor = await buildRequestActorContext(mobileSupabase);
      setActor(nextActor);
      setActorStatus("ready");
    } catch (error) {
      setActor(null);
      setActorStatus("error");
      setActorError(error instanceof Error ? error.message : "Failed to resolve actor context");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const stopAutoRefresh = bindMobileSupabaseAutoRefresh();
    const {
      data: { subscription },
    } = mobileSupabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      void resolveActor(nextSession);
    });

    const bootstrap = async () => {
      try {
        const {
          data: { session: restoredSession },
          error,
        } = await mobileSupabase.auth.getSession();

        if (!isMounted) return;
        if (error) {
          throw error;
        }

        setSession(restoredSession);
        await resolveActor(restoredSession);
      } finally {
        if (isMounted) {
          setBootstrapStatus("ready");
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
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
    setActorStatus("loading");
    setActorError(null);
    try {
      const refreshed = await resolveActorFromCurrentSession();
      setActor(refreshed);
      setActorStatus(refreshed ? "ready" : "idle");
    } catch (error) {
      setActor(null);
      setActorStatus("error");
      setActorError(error instanceof Error ? error.message : "Failed to resolve actor context");
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
