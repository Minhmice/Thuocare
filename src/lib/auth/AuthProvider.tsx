import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { OnboardingSurveyAnswers } from "../../types/onboarding-survey";
import { resolveAuthEmailFromIdentifier, syntheticEmailFromPhone } from "./authEmail";
import {
  isConfirmationEmailDeliveryError,
  RedirectToSignInAfterSignUp,
  translateAuthError
} from "./authErrors";
import {
  deriveRoutineSegment,
  mapQ5ToReminderPreference,
  mapQ6ToRoutineStage
} from "./mapOnboardingSurvey";
import { clearOnboardingSurveyDraft } from "./onboardingSurveyDraft";
import { isLikelyAuthStorageError, resetAuthAndGoToSignIn } from "./authRecovery";
import type { StoredAuthRecord } from "./storage";
import { normalizeVnPhoneForDisplay } from "../phone/vnDisplay";
import { supabase } from "../supabase/client";
import {
  backfillProfilePhoneIfMissing,
  fetchProfileRow,
  fetchProfileRowWithRetry,
  profileRowToStoredRecord,
  syncProfileContact
} from "../supabase/profileRepository";

type AuthStatus = "loading" | "signedOut" | "needsOnboarding" | "ready";

export type SignInInput = {
  identifier: string;
  password: string;
};

export type SignUpInput = {
  phone: string;
  email?: string;
  password: string;
  fullName: string;
};

export type CompleteOnboardingInput = {
  survey: OnboardingSurveyAnswers;
};

type AuthContextValue = {
  record: StoredAuthRecord | null;
  status: AuthStatus;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthStatus(record: StoredAuthRecord | null, hydrated: boolean): AuthStatus {
  if (!hydrated) return "loading";
  if (!record) return "signedOut";
  if (!record.onboardingCompleted) return "needsOnboarding";
  return "ready";
}

async function applySessionToRecord(session: Session | null): Promise<StoredAuthRecord | null> {
  if (!session?.user) {
    return null;
  }
  let row = await fetchProfileRowWithRetry(session.user.id);
  if (!row) {
    await supabase.auth.signOut();
    return null;
  }
  row = await backfillProfilePhoneIfMissing(session.user, row);
  return profileRowToStoredRecord(session.user, row);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [record, setRecord] = useState<StoredAuthRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run(session: Session | null) {
      try {
        const next = await applySessionToRecord(session);
        if (!cancelled) {
          setRecord(next);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        if (!cancelled) {
          setRecord(null);
        }
        if (!cancelled && isLikelyAuthStorageError(msg)) {
          await resetAuthAndGoToSignIn();
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        void run(session);
      })
      .catch(async () => {
        if (!cancelled) {
          setRecord(null);
          setHydrated(true);
        }
        await resetAuthAndGoToSignIn();
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      void run(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(input: SignInInput) {
    const email = resolveAuthEmailFromIdentifier(input.identifier);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password
    });
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
    const session = data.session;
    if (!session?.user) {
      throw new Error("No session after sign-in.");
    }
    let row = await fetchProfileRowWithRetry(session.user.id);
    if (!row) {
      throw new Error("Could not load your profile. Try again.");
    }
    row = await backfillProfilePhoneIfMissing(session.user, row);
    setRecord(profileRowToStoredRecord(session.user, row));
  }

  async function signUp(input: SignUpInput) {
    const phone = normalizeVnPhoneForDisplay(input.phone.trim());
    const email =
      input.email && input.email.trim().length > 0
        ? input.email.trim().toLowerCase()
        : syntheticEmailFromPhone(phone);

    const password = input.password;

    let data: Awaited<ReturnType<typeof supabase.auth.signUp>>["data"];
    let error: Awaited<ReturnType<typeof supabase.auth.signUp>>["error"];
    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: input.fullName.trim(),
            phone,
            timezone: "Asia/Ho_Chi_Minh"
          }
        }
      });
      data = res.data;
      error = res.error;
    } catch (e) {
      throw e;
    }

    async function finishWithSessionUser(user: NonNullable<typeof data.session>["user"]) {
      let row = await fetchProfileRowWithRetry(user.id);
      if (!row) {
        throw new Error("Account created but profile is not ready yet. Sign in again in a moment.");
      }
      row = await backfillProfilePhoneIfMissing(user, row);
      await syncProfileContact(user.id, {
        phone,
        fullName: input.fullName.trim(),
        email
      });
      const refreshed = await fetchProfileRow(user.id);
      if (refreshed) {
        row = refreshed;
      }
      setRecord(profileRowToStoredRecord(user, row));
    }

    if (__DEV__ && error) {
      console.warn("[Thuocare auth] signUp error", {
        message: error.message,
        hasUser: Boolean(data?.user),
        hasSession: Boolean(data?.session)
      });
    }

    if (error) {
      if (isConfirmationEmailDeliveryError(error.message)) {
        const signedIn = await supabase.auth.signInWithPassword({ email, password });
        if (!signedIn.error && signedIn.data.session?.user) {
          await finishWithSessionUser(signedIn.data.session.user);
          return;
        }
        if (data?.user) {
          throw new RedirectToSignInAfterSignUp();
        }
        throw new Error(
          "No account was created (email step failed). In Supabase → Authentication → Providers → Email: turn OFF “Confirm email”, then try again. Also check Dashboard → Logs if signup still fails."
        );
      }
      throw new Error(translateAuthError(error.message));
    }

    if (data.session?.user) {
      await finishWithSessionUser(data.session.user);
      return;
    }
    const signedIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signedIn.error && signedIn.data.session?.user) {
      await finishWithSessionUser(signedIn.data.session.user);
      return;
    }

    if (data?.user) {
      throw new RedirectToSignInAfterSignUp();
    }

    throw new Error(
      "No session after sign-up and no user record returned. In Supabase → Authentication → Providers → Email: disable “Confirm email” for immediate access, then try again."
    );
  }

  async function signOut() {
    setRecord(null);
    await supabase.auth.signOut();
  }

  async function completeOnboarding(input: CompleteOnboardingInput) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error(userError.message);
    }
    const user = userData.user;
    if (!user) {
      throw new Error("You need an account before completing onboarding.");
    }

    const survey = input.survey;
    const reminderPreference = mapQ5ToReminderPreference(survey.q5!);
    const routineStage = mapQ6ToRoutineStage(survey.q6!);
    const routineSegment = deriveRoutineSegment(survey);

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_survey: survey,
        reminder_preference: reminderPreference,
        routine_stage: routineStage,
        routine_segment: routineSegment
      })
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    await clearOnboardingSurveyDraft(user.id);

    const refreshed = await fetchProfileRow(user.id);
    if (refreshed) {
      setRecord(profileRowToStoredRecord(user, refreshed));
    }
  }

  const value: AuthContextValue = {
    record,
    status: getAuthStatus(record, hydrated),
    signIn,
    signUp,
    signOut,
    completeOnboarding
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
