// ─── Appointment status ───────────────────────────────────────────────────
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type BackendRole = 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN'

export type AppointmentType = 'IN_PERSON' | 'TELEHEALTH' | 'TELEMEDICINE'

export type SlotStatus = 'OPEN' | 'HELD' | 'TAKEN' | 'PAST'

// ─── Avatar / badge tones ─────────────────────────────────────────────────
export type AvatarTone = 'primary' | 'teal' | 'indigo' | 'amber' | 'rose' | 'slate'

// ─── Role ─────────────────────────────────────────────────────────────────
export type UserRole = 'patient' | 'doctor' | 'admin' | 'super_admin'

// ─── Domain entities ──────────────────────────────────────────────────────
export interface Doctor {
  id: string
  userId?: string
  name: string
  email?: string
  spec?: string
  dept?: string
  specialization?: string
  department?: string
  departmentId?: string
  bio?: string
  licenseNumber?: string
  acceptingNew?: boolean
  slotDurationMins?: number
  languages?: string
  gender?: string
  telemedicineEnabled?: boolean
  yearsOfExperience?: number
  consultationFee?: number
  seniorConsultant?: boolean
  averageRating?: number
  reviewCount?: number
  tone: AvatarTone
  next: string
  city: string
}

export interface Specialization {
  id: string
  name: string
}

export interface Appointment {
  id: string
  doctorId: string
  patientName: string
  doctorName: string
  spec: string
  date: string
  time: string
  location: string
  status: AppointmentStatus
  tone: AvatarTone
  cancelable: boolean
  soon: boolean
}

export interface Department {
  name: string
  code: string
  docs: number
  appts: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface DoctorProfile {
  name: string
  email: string
  dept: string
  spec: string
  appts: number
  status: 'ACTIVE' | 'INACTIVE'
  tone: AvatarTone
}

export interface CapacityRow {
  name: string
  dept: string
  booked: number
  total: number
  tone: AvatarTone
}

export interface DeptAnalytics {
  dept: string
  completed: number
  scheduled: number
  cancelled: number
  noshow: number
}
