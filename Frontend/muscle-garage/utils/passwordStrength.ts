export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string;
  suggestions: string[];
}

export const getPasswordStrength = (password: string): PasswordStrengthResult => {
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return { strength: 'weak', score: 0, feedback: '', suggestions: [] };
  }

  // Length check
  if (password.length >= 6) score += 1;
  else suggestions.push('At least 6 characters');

  if (password.length >= 10) score += 1;
  if (password.length >= 16) score += 1;

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Add lowercase letters (a-z)');

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Add uppercase letters (A-Z)');

  // Number check
  if (/\d/.test(password)) score += 1;
  else suggestions.push('Add numbers (0-9)');

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else suggestions.push('Add special characters (!@#$%^&*)');

  // Determine strength
  let feedback = '';
  let strength: PasswordStrength;
  
  if (score <= 2) {
    feedback = 'Weak';
    strength = 'weak';
  } else if (score <= 4) {
    feedback = 'Medium';
    strength = 'medium';
  } else if (score < 7) {
    feedback = 'Strong';
    strength = 'strong';
  } else {
    feedback = 'Very Strong';
    strength = 'very-strong';
  }

  return { strength, score, feedback, suggestions };
};

export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return '#C41717';
    case 'medium':
      return '#E57A25';
    case 'strong':
      return '#28A745';
    case 'very-strong':
      return '#28A745';
    default:
      return '#6A6A6A';
  }
};

export const getPasswordStrengthLabel = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    case 'very-strong':
      return 'Very Strong';
    default:
      return '';
  }
};
