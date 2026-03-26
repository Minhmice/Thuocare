export type DataSource = "mock" | "supabase";

export const dataSource: DataSource =
  process.env.EXPO_PUBLIC_USE_MOCKS === "1" || process.env.EXPO_PUBLIC_USE_MOCKS === "true"
    ? "mock"
    : "supabase";

