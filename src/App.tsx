import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { LoadingDots } from '@/components/feedback/LoadingDots'
import { TourOverlay } from '@/features/onboarding/TourOverlay'
import { MediBookAssistantWidget } from '@/features/shared/ai-assistant/MediBookAssistantWidget'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UnauthorizedState } from '@/components/auth/UnauthorizedState'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'

// ── Landing ───────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('@/features/landing/LandingPage'))

// ── Auth ──────────────────────────────────────────────────────────────────
const MobLogin           = lazy(() => import('@/features/auth/MobLogin'))
const MobRegister        = lazy(() => import('@/features/auth/MobRegister'))
const MobForgotPassword  = lazy(() => import('@/features/auth/MobForgotPassword'))
const MobResetPassword   = lazy(() => import('@/features/auth/MobResetPassword'))
const MobVerifyEmail     = lazy(() => import('@/features/auth/MobVerifyEmail'))

// ── Patient ───────────────────────────────────────────────────────────────
const MobSearch              = lazy(() => import('@/features/patient/MobSearch'))
const MobDoctorDetail        = lazy(() => import('@/features/patient/MobDoctorDetail'))
const MobBookReview          = lazy(() => import('@/features/patient/MobBookReview'))
const MobMyAppts             = lazy(() => import('@/features/patient/MobMyAppts'))
const MobProfile             = lazy(() => import('@/features/patient/MobProfile'))
const MobNotifications       = lazy(() => import('@/features/patient/MobNotifications'))
const MobConsultationHistory = lazy(() => import('@/features/patient/MobConsultationHistory'))
const MobInvoices            = lazy(() => import('@/features/patient/MobInvoices'))
const MobWaitlist            = lazy(() => import('@/features/patient/MobWaitlist'))
const MobRecurringAppts      = lazy(() => import('@/features/patient/MobRecurringAppts'))

// ── Doctor ────────────────────────────────────────────────────────────────
const MobDocSchedule = lazy(() => import('@/features/doctor/MobDocSchedule'))
const MobDocApptDetail = lazy(() => import('@/features/doctor/MobDocApptDetail'))
const MobDocNote     = lazy(() => import('@/features/doctor/MobDocNote'))
const MobDocHours    = lazy(() => import('@/features/doctor/MobDocHours'))
const MobDocProfile  = lazy(() => import('@/features/doctor/MobDocProfile'))
const MobDocLeave    = lazy(() => import('@/features/doctor/MobDocLeave'))

// ── Shared ────────────────────────────────────────────────────────────────
const MobTelemedicine = lazy(() => import('@/features/shared/MobTelemedicine'))
const AiChat          = lazy(() => import('@/features/shared/AiChat'))

// ── Admin ─────────────────────────────────────────────────────────────────
const DeskPatientSearch    = lazy(() => import('@/features/admin/DeskPatientSearch'))
const DeskDepartments      = lazy(() => import('@/features/admin/DeskDepartments'))
const DeskDoctors          = lazy(() => import('@/features/admin/DeskDoctors'))
const DeskAnalytics        = lazy(() => import('@/features/admin/DeskAnalytics'))
const DeskCapacity         = lazy(() => import('@/features/admin/DeskCapacity'))
const DeskDoctorSchedule   = lazy(() => import('@/features/admin/DeskDoctorSchedule'))
const DeskSettings         = lazy(() => import('@/features/admin/DeskSettings'))
const DeskSuperAdmins      = lazy(() => import('@/features/admin/DeskSuperAdmins'))
const MobDeletedRecords    = lazy(() => import('@/features/admin/MobDeletedRecords'))

const Spinner = (
  <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: MB.bg2 }}>
    <LoadingDots />
  </div>
)

export default function App() {
  const authStatus = useAuthStore((s) => s.status)
  useIdleTimeout(15 * 60 * 1000)

  return (
    <BrowserRouter>
      <div className="mb" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Suspense fallback={Spinner}>
          <Routes>
            {/* ── Public ─────────────────────────────────────────────── */}
            <Route path="/login"           element={<MobLogin />} />
            <Route path="/register"        element={<MobRegister />} />
            <Route path="/forgot-password" element={<MobForgotPassword />} />
            <Route path="/reset-password"  element={<MobResetPassword />} />
            <Route path="/verify-email"    element={<MobVerifyEmail />} />
            <Route path="/unauthorized"    element={<UnauthorizedState />} />

            {/* ── Patient ────────────────────────────────────────────── */}
            <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><Navigate to="/patient/search" /></ProtectedRoute>} />
            <Route path="/patient/search"    element={<ProtectedRoute allowedRoles={['patient']}><MobSearch /></ProtectedRoute>} />
            <Route path="/patient/doctor/:id" element={<ProtectedRoute allowedRoles={['patient']}><MobDoctorDetail /></ProtectedRoute>} />
            <Route path="/patient/book/review" element={<ProtectedRoute allowedRoles={['patient']}><MobBookReview /></ProtectedRoute>} />
            <Route path="/patient/appts"     element={<ProtectedRoute allowedRoles={['patient']}><MobMyAppts /></ProtectedRoute>} />
            <Route path="/patient/history"   element={<ProtectedRoute allowedRoles={['patient']}><MobConsultationHistory /></ProtectedRoute>} />
            <Route path="/patient/invoices"  element={<ProtectedRoute allowedRoles={['patient']}><MobInvoices /></ProtectedRoute>} />
            <Route path="/patient/notifications" element={<ProtectedRoute allowedRoles={['patient']}><MobNotifications /></ProtectedRoute>} />
            <Route path="/patient/profile"   element={<ProtectedRoute allowedRoles={['patient']}><MobProfile /></ProtectedRoute>} />
            <Route path="/patient/waitlist"  element={<ProtectedRoute allowedRoles={['patient']}><MobWaitlist /></ProtectedRoute>} />
            <Route path="/patient/recurring" element={<ProtectedRoute allowedRoles={['patient']}><MobRecurringAppts /></ProtectedRoute>} />
            <Route path="/patient/telemedicine/:sessionId" element={<ProtectedRoute allowedRoles={['patient']}><MobTelemedicine /></ProtectedRoute>} />
            <Route path="/patient/chat/:conversationId"  element={<ProtectedRoute allowedRoles={['patient']}><AiChat /></ProtectedRoute>} />

            {/* ── Doctor ─────────────────────────────────────────────── */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><Navigate to="/doctor/schedule" /></ProtectedRoute>} />
            <Route path="/doctor/schedule"    element={<ProtectedRoute allowedRoles={['doctor']}><MobDocSchedule /></ProtectedRoute>} />
            <Route path="/doctor/appt/:id"    element={<ProtectedRoute allowedRoles={['doctor']}><MobDocApptDetail /></ProtectedRoute>} />
            <Route path="/doctor/appt/:id/note" element={<ProtectedRoute allowedRoles={['doctor']}><MobDocNote /></ProtectedRoute>} />
            <Route path="/doctor/hours"       element={<ProtectedRoute allowedRoles={['doctor']}><MobDocHours /></ProtectedRoute>} />
            <Route path="/doctor/profile"     element={<ProtectedRoute allowedRoles={['doctor']}><MobDocProfile /></ProtectedRoute>} />
            <Route path="/doctor/leave"       element={<ProtectedRoute allowedRoles={['doctor']}><MobDocLeave /></ProtectedRoute>} />
            <Route path="/doctor/telemedicine/:sessionId" element={<ProtectedRoute allowedRoles={['doctor']}><MobTelemedicine /></ProtectedRoute>} />
            <Route path="/doctor/chat/:conversationId"   element={<ProtectedRoute allowedRoles={['doctor']}><AiChat /></ProtectedRoute>} />

            {/* ── Admin ──────────────────────────────────────────────── */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Navigate to="/admin/patients" /></ProtectedRoute>} />
            <Route path="/admin/patients"  element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskPatientSearch /></ProtectedRoute>} />
            <Route path="/admin/depts"     element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskDepartments /></ProtectedRoute>} />
            <Route path="/admin/docs"      element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskDoctors /></ProtectedRoute>} />
            <Route path="/admin/schedule"  element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskDoctorSchedule /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskAnalytics /></ProtectedRoute>} />
            <Route path="/admin/capacity"  element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskCapacity /></ProtectedRoute>} />
            <Route path="/admin/settings"  element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DeskSettings /></ProtectedRoute>} />
            <Route path="/admin/admins"    element={<ProtectedRoute allowedRoles={['super_admin']}><DeskSuperAdmins /></ProtectedRoute>} />
            <Route path="/admin/deleted-records" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><MobDeletedRecords /></ProtectedRoute>} />

            {/* ── Default ────────────────────────────────────────────── */}
            <Route path="/"  element={<LandingPage />} />
            <Route path="*"  element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {authStatus === 'authenticated' && <TourOverlay />}
        <MediBookAssistantWidget />
      </div>
    </BrowserRouter>
  )
}
