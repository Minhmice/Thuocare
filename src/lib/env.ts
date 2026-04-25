type EnvConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function requireNamedEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnvConfig(): EnvConfig {
  const supabaseUrl = requireNamedEnv(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  const supabaseAnonKey = requireNamedEnv(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );

  return {
    supabaseUrl,
    supabaseAnonKey
  };
}
