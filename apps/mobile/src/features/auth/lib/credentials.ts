import { emailSchema } from '@thuocare/validation';

export interface SignInValidationResult {
  email: string;
  password: string;
  error: string | null;
}

export interface SignUpValidationResult {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
}

export function validateSignInInput(emailRaw: string, passwordRaw: string): SignInValidationResult {
  const email = emailRaw.trim();
  const password = passwordRaw;

  if (!email || !password) {
    return { email, password, error: 'Please enter your email and password.' };
  }

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { email, password, error: 'Please enter a valid email address.' };
  }

  return { email, password, error: null };
}

export function validateSignUpInput(
  fullNameRaw: string,
  emailRaw: string,
  passwordRaw: string,
  confirmPasswordRaw: string,
): SignUpValidationResult {
  const fullName = fullNameRaw.trim();
  const email = emailRaw.trim();
  const password = passwordRaw;
  const confirmPassword = confirmPasswordRaw;

  if (!fullName || !email || !password || !confirmPassword) {
    return {
      fullName,
      email,
      password,
      confirmPassword,
      error: 'Please fill in all fields to continue.',
    };
  }

  if (fullName.length < 2) {
    return {
      fullName,
      email,
      password,
      confirmPassword,
      error: 'Please enter your full name.',
    };
  }

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return {
      fullName,
      email,
      password,
      confirmPassword,
      error: 'Please enter a valid email address.',
    };
  }

  if (password.length < 8) {
    return {
      fullName,
      email,
      password,
      confirmPassword,
      error: 'Password must be at least 8 characters.',
    };
  }

  if (password !== confirmPassword) {
    return {
      fullName,
      email,
      password,
      confirmPassword,
      error: 'Passwords do not match.',
    };
  }

  return { fullName, email, password, confirmPassword, error: null };
}
