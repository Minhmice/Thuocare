import * as SecureStore from "expo-secure-store";

export type AppLanguage = "en" | "vi";

const LANGUAGE_KEY = "thuocare.language.v1";

export async function readLanguage(): Promise<AppLanguage> {
  const value = await SecureStore.getItemAsync(LANGUAGE_KEY);
  if (value === "vi" || value === "en") {
    return value;
  }
  return "en";
}

export async function writeLanguage(language: AppLanguage): Promise<void> {
  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}
