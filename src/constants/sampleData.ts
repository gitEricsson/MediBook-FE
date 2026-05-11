import type { Doctor, Appointment } from '@/types/domain'

export const SAMPLE_DOCS: Doctor[] = [
  { id: 'd1', name: 'Sarah Chen',     spec: 'Cardiology',    dept: 'Cardiology',    tone: 'primary', next: 'Tomorrow · 9:00 AM', city: 'SF' },
  { id: 'd2', name: 'Marcus Okafor',  spec: 'Dermatology',   dept: 'Dermatology',   tone: 'teal',    next: 'Today · 4:30 PM',   city: 'SF' },
  { id: 'd3', name: 'Priya Raghavan', spec: 'Pediatrics',    dept: 'Pediatrics',    tone: 'amber',   next: 'May 12 · 11:30 AM', city: 'Oakland' },
  { id: 'd4', name: 'James Whitfield',spec: 'Orthopedics',   dept: 'Orthopedics',   tone: 'indigo',  next: 'May 9 · 2:15 PM',   city: 'SF' },
  { id: 'd5', name: 'Lina Haddad',    spec: 'Endocrinology', dept: 'Internal Med.', tone: 'rose',    next: 'May 14 · 10:00 AM', city: 'Daly City' },
]

export const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1', doctorId: 'd1', patientName: 'Sarah Patient',
    doctorName: 'Dr. Sarah Chen', spec: 'Cardiology',
    date: 'Wed, May 7', time: '9:30 AM', location: 'Bay General · Rm 412',
    status: 'CONFIRMED', tone: 'primary', cancelable: true, soon: true,
  },
  {
    id: 'a2', doctorId: 'd2', patientName: 'Sarah Patient',
    doctorName: 'Dr. Marcus Okafor', spec: 'Dermatology',
    date: 'Mon, May 19', time: '3:00 PM', location: 'Mission Health Clinic',
    status: 'CONFIRMED', tone: 'teal', cancelable: true, soon: false,
  },
]

export const WEEK_DAYS = ['M','T','W','T','F','S','S'] as const
