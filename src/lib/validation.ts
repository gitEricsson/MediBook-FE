/**
 * Form validation utilities for authentication and user input forms
 * Ensures data integrity and security constraints
 */

/**
 * Validates a password string against security requirements
 * Returns an array of failing rules (empty if password is valid)
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 */
export function validatePassword(password: string): string[] {
  const failingRules: string[] = [];

  if (!password) {
    return ['Password is required'];
  }

  if (password.length < 8) {
    failingRules.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    failingRules.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    failingRules.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    failingRules.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    failingRules.push('Password must contain at least one special character');
  }

  return failingRules;
}

/**
 * Validates an email address format
 * Returns error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }

  // RFC 5322 simplified regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validates a password confirmation matches the original
 */
export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) {
    return 'Passwords do not match';
  }

  return null;
}

/**
 * Validates minimum text length
 */
export function validateMinLength(text: string, min: number, fieldName: string): string | null {
  if (!text || text.trim().length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }

  return null;
}

/**
 * Validates maximum text length
 */
export function validateMaxLength(text: string, max: number, fieldName: string): string | null {
  if (text && text.length > max) {
    return `${fieldName} must not exceed ${max} characters`;
  }

  return null;
}

/**
 * Validates that field is not empty
 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }

  return null;
}

/**
 * Validates a phone number (basic format: 10+ digits)
 */
export function validatePhoneNumber(phone: string): string | null {
  if (!phone) {
    return 'Phone number is required';
  }

  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return 'Phone number must contain at least 10 digits';
  }

  return null;
}

/**
 * Validates a number is in a range (inclusive)
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }

  return null;
}
