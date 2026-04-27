import * as SecureStore from "expo-secure-store";

export type AppLanguage = "en" | "vi";

const LANGUAGE_KEY = "thuocare.language.v1";

export async function readLanguage(): Promise<AppLanguage> {
  try {
    const value = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (value === "vi" || value === "en") {
      return value;
    }
  } catch {
    // Fall back to default language if SecureStore is unavailable.
  }
  return "en";
}

export async function writeLanguage(language: AppLanguage): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
  } catch {
    // Ignore write failures; language will default to "en" next launch.
  }
}
