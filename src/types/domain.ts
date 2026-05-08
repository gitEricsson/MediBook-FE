// ─── Appointment status ───────────────────────────────────────────────────
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'UPCOMING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'

// ─── Avatar / badge tones ─────────────────────────────────────────────────
export type AvatarTone = 'primary' | 'teal' | 'indigo' | 'amber' | 'rose' | 'slate'

// ─── Role ─────────────────────────────────────────────────────────────────
export type UserRole = 'patient' | 'doctor' | 'admin'

// ─── Domain entities ──────────────────────────────────────────────────────
export interface Doctor {
  id: string
  name: string
  spec?: string
  dept?: string
  specialization?: string
  department?: string
  bio?: string
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
