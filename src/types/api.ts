import { UserRole } from './domain';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  twoFactorRequired?: boolean;
  user?: UserResponse;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dob?: string;
}

export interface RegisterResponse {
  user: UserResponse;
}

export interface Verify2FARequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Booking & Discovery Types
export interface AppointmentHoldRequest {
  doctorId: number;
  scheduledAt: string;
  type: 'IN_PERSON' | 'TELEHEALTH';
  durationMins?: number;
  reason?: string;
}

export interface AppointmentHoldResponse {
  holdId: string;
  expiresAt: string;
}

export interface AppointmentConfirmRequest {
  holdId: string;
  doctorId: number;
  scheduledAt: string;
  type: 'IN_PERSON' | 'TELEHEALTH';
  durationMins?: number;
  reason?: string;
}

export interface Appointment {
  id: number;
  doctorId: number;
  patientId: number;
  doctorName: string;
  patientName: string;
  departmentName?: string;
  scheduledAt: string;
  durationMins: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  type: 'IN_PERSON' | 'TELEHEALTH';
  reason?: string;
  confirmationCode?: string;
  notes?: string;
  createdAt: string;
}

export interface DoctorAvailability {
  date: string;
  slots: {
    id: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface NotificationResponse {
  notificationId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  appointmentId?: number;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  role: 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN';
  enabled: boolean;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  locale?: string;
}
