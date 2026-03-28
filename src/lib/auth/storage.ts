import * as SecureStore from "expo-secure-store";

export type ReminderPreference = "quiet" | "balanced" | "firm";
export type RoutineStage = "starting" | "steady" | "resetting";

export type StoredAuthRecord = {
  id: string;
  phone: string;
  email: string | null;
  password: string;
  fullName: string;
  onboardingCompleted: boolean;
  routineStage: RoutineStage | null;
  reminderPreference: ReminderPreference | null;
  createdAt: string;
};

export type AuthStore = {
  accounts: StoredAuthRecord[];
  activeAccountId: string | null;
};

// v2 key — multi-account format, incompatible with the old single-record key
const AUTH_STORE_KEY = "thuocare.mock.auth-store.v2";

const emptyStore = (): AuthStore => ({ accounts: [], activeAccountId: null });

export async function readAuthStore(): Promise<AuthStore> {
  const raw = await SecureStore.getItemAsync(AUTH_STORE_KEY);
  if (!raw) {
    return emptyStore();
  }
  return JSON.parse(raw) as AuthStore;
}

export async function writeAuthStore(store: AuthStore): Promise<void> {
  await SecureStore.setItemAsync(AUTH_STORE_KEY, JSON.stringify(store));
}
