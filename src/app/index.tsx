import { Redirect } from "expo-router";
import { LoadingState } from "../components/state/LoadingState";
import { useAuth } from "../lib/auth/AuthProvider";

export default function IndexScreen() {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "signedOut") {
    return <Redirect href="/sign-in" />;
  }

  if (status === "needsOnboarding") {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
