export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  score: number;
  level: PasswordStrengthLevel;
  label: 'Weak' | 'Medium' | 'Strong';
  activeBars: 1 | 2 | 3;
}

function hasLowercase(value: string) {
  return /[a-z]/.test(value);
}

function hasUppercase(value: string) {
  return /[A-Z]/.test(value);
}

function hasNumber(value: string) {
  return /\d/.test(value);
}

function hasSpecial(value: string) {
  return /[^A-Za-z0-9]/.test(value);
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (password.length === 0) {
    return { score: 0, level: 'weak', label: 'Weak', activeBars: 1 };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (hasLowercase(password) && hasUppercase(password)) score += 1;
  if (hasNumber(password)) score += 1;
  if (hasSpecial(password)) score += 1;

  if (score >= 5) {
    return { score, level: 'strong', label: 'Strong', activeBars: 3 };
  }

  if (score >= 3) {
    return { score, level: 'medium', label: 'Medium', activeBars: 2 };
  }

  return { score, level: 'weak', label: 'Weak', activeBars: 1 };
}
