import { Redirect } from "expo-router";

// Forgot password is now a shared modal opened from Sign In and Sign Up.
// Direct navigation to this route redirects back to sign-in.
export default function ForgotPasswordRoute() {
  return <Redirect href="/sign-in" />;
}
