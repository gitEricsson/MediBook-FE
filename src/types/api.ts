import type { AppointmentStatus, AppointmentType, BackendRole, SlotStatus, UserRole } from './domain';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface BackendFieldError {
  field: string;
  message: string;
}

export interface BackendErrorResponse {
  status?: number;
  errorCode?: string;
  message: string;
  timestamp?: string;
  errors?: BackendFieldError[];
  success?: false;
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
  errors?: Record<string, string>;
}

// Booking & Discovery Types
export interface AppointmentHoldRequest {
  doctorId: number;
  scheduledAt: string;
  type?: AppointmentType;
  durationMins?: number;
  reason?: string;
}

export interface AppointmentHoldResponse {
  holdId: string;
  expiresAt: string;
}

export interface AppointmentConfirmRequest {
  holdId?: string;
  doctorId: number;
  scheduledAt: string;
  type: AppointmentType;
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
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  confirmationCode?: string;
  notes?: string;
  createdAt: string;
}

export interface DoctorAvailability {
  date: string;
  slots: {
    id: string;
    start: string;
    end: string;
    startTime: string;
    endTime: string;
    status: SlotStatus;
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
  role: BackendRole;
  enabled: boolean;
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  locale?: string;
  createdAt?: string;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  content: T[];
}

export interface DoctorResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  departmentId: number;
  departmentName: string;
  languages?: string;
  acceptingNew: boolean;
  slotDurationMins: number;
  createdAt?: string;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  active?: boolean;
  createdAt?: string;
}

export interface DepartmentAdminResponse {
  id: number;
  name: string;
  code: string;
  doctorsCount: number;
  apptCount90d: number;
  status: boolean;
}
