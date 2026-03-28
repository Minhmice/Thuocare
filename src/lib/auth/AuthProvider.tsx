import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { MOCK_AUTH_ACCOUNTS } from "../../mocks/authAccounts";
import {
  type AuthStore,
  type ReminderPreference,
  type RoutineStage,
  type StoredAuthRecord,
  readAuthStore,
  writeAuthStore
} from "./storage";

type AuthStatus = "loading" | "signedOut" | "needsOnboarding" | "ready";

export type SignInInput = {
  identifier: string; // phone or email
  password: string;
};

export type SignUpInput = {
  phone: string;
  email?: string;
  password: string;
  fullName: string;
};

export type CompleteOnboardingInput = {
  routineStage: RoutineStage;
  reminderPreference: ReminderPreference;
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

function findActiveAccount(store: AuthStore): StoredAuthRecord | null {
  if (!store.activeAccountId) return null;
  return store.accounts.find((a) => a.id === store.activeAccountId) ?? null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [activeAccount, setActiveAccount] = useState<StoredAuthRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      let store = await readAuthStore();

      // Always ensure mock test accounts are present.
      // Merges by id so existing real accounts are preserved.
      const existingIds = new Set(store.accounts.map((a) => a.id));
      const missing = MOCK_AUTH_ACCOUNTS.filter((a) => !existingIds.has(a.id));
      if (missing.length > 0) {
        store = { ...store, accounts: [...missing, ...store.accounts] };
        await writeAuthStore(store);
      }

      if (!isMounted) return;
      setActiveAccount(findActiveAccount(store));
      setHydrated(true);
    }

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  async function signIn(input: SignInInput) {
    const store = await readAuthStore();
    const trimmed = input.identifier.trim();

    const account = store.accounts.find(
      (a) =>
        a.phone === trimmed ||
        (a.email && a.email.toLowerCase() === trimmed.toLowerCase())
    );

    if (!account) {
      throw new Error("No account found with this phone or email.");
    }

    if (account.password !== input.password) {
      throw new Error("Incorrect password.");
    }

    const nextStore: AuthStore = { ...store, activeAccountId: account.id };
    await writeAuthStore(nextStore);
    setActiveAccount(account);
  }

  async function signUp(input: SignUpInput) {
    const store = await readAuthStore();
    const phone = input.phone.trim();

    const phoneExists = store.accounts.some((a) => a.phone === phone);
    if (phoneExists) {
      throw new Error(
        "This phone number is already registered. Please tap Forgot Password to recover access."
      );
    }

    const newAccount: StoredAuthRecord = {
      id: Date.now().toString(),
      phone,
      email: input.email ? input.email.trim().toLowerCase() : null,
      password: input.password,
      fullName: input.fullName.trim(),
      onboardingCompleted: false,
      routineStage: null,
      reminderPreference: null,
      createdAt: new Date().toISOString()
    };

    const nextStore: AuthStore = {
      accounts: [...store.accounts, newAccount],
      activeAccountId: newAccount.id
    };

    await writeAuthStore(nextStore);
    setActiveAccount(newAccount);
  }

  async function signOut() {
    const store = await readAuthStore();
    const nextStore: AuthStore = { ...store, activeAccountId: null };
    await writeAuthStore(nextStore);
    setActiveAccount(null);
  }

  async function completeOnboarding(input: CompleteOnboardingInput) {
    if (!activeAccount) {
      throw new Error("You need an account before completing onboarding.");
    }

    const store = await readAuthStore();

    const updatedAccount: StoredAuthRecord = {
      ...activeAccount,
      routineStage: input.routineStage,
      reminderPreference: input.reminderPreference,
      onboardingCompleted: true
    };

    const nextStore: AuthStore = {
      ...store,
      accounts: store.accounts.map((a) =>
        a.id === updatedAccount.id ? updatedAccount : a
      )
    };

    await writeAuthStore(nextStore);
    setActiveAccount(updatedAccount);
  }

  const value: AuthContextValue = {
    record: activeAccount,
    status: getAuthStatus(activeAccount, hydrated),
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
