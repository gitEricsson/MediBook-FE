import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { LoadingDots } from '@/components/feedback/LoadingDots'
import { TourOverlay } from '@/features/onboarding/TourOverlay'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'

// ── Lazy load feature screens ───────────────────────────────────────────
// ...

// Auth
const MobLogin = lazy(() => import('@/features/auth/MobLogin'))
const MobRegister = lazy(() => import('@/features/auth/MobRegister'))

// Patient
const MobSearch = lazy(() => import('@/features/patient/MobSearch'))
const MobDoctorDetail = lazy(() => import('@/features/patient/MobDoctorDetail'))
const MobBookReview = lazy(() => import('@/features/patient/MobBookReview'))
const MobMyAppts = lazy(() => import('@/features/patient/MobMyAppts'))
const MobProfile = lazy(() => import('@/features/patient/MobProfile'))
const MobNotifications = lazy(() => import('@/features/patient/MobNotifications'))

// Doctor
const MobDocSchedule = lazy(() => import('@/features/doctor/MobDocSchedule'))
const MobDocApptDetail = lazy(() => import('@/features/doctor/MobDocApptDetail'))
const MobDocNote = lazy(() => import('@/features/doctor/MobDocNote'))
const MobDocHours = lazy(() => import('@/features/doctor/MobDocHours'))

// Admin
const DeskPatientSearch = lazy(() => import('@/features/admin/DeskPatientSearch'))
const DeskDepartments = lazy(() => import('@/features/admin/DeskDepartments'))
const DeskDoctors = lazy(() => import('@/features/admin/DeskDoctors'))
const DeskAnalytics = lazy(() => import('@/features/admin/DeskAnalytics'))
const DeskSettings = lazy(() => import('@/features/admin/DeskSettings'))

// ── Root Component ──────────────────────────────────────────────────────

export default function App() {
  const authStatus = useAuthStore((state) => state.status)
  
  // Enable healthcare-grade session idle timeout (15 mins)
  useIdleTimeout(15 * 60 * 1000);

  return (
    <BrowserRouter>
      <div className="mb" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Suspense fallback={
          <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: MB.bg2 }}>
            <LoadingDots />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<MobLogin />} />
            <Route path="/register" element={<MobRegister />} />
            <Route path="/unauthorized" element={<Navigate to="/login" replace />} />

            {/* Patient Routes */}
            <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><Navigate to="/patient/search" /></ProtectedRoute>} />
            <Route path="/patient/search" element={<ProtectedRoute allowedRoles={['patient']}><MobSearch /></ProtectedRoute>} />
            <Route path="/patient/doctor/:id" element={<ProtectedRoute allowedRoles={['patient']}><MobDoctorDetail /></ProtectedRoute>} />
            <Route path="/patient/book/review" element={<ProtectedRoute allowedRoles={['patient']}><MobBookReview /></ProtectedRoute>} />
            <Route path="/patient/appts" element={<ProtectedRoute allowedRoles={['patient']}><MobMyAppts /></ProtectedRoute>} />
            <Route path="/patient/notifications" element={<ProtectedRoute allowedRoles={['patient']}><MobNotifications /></ProtectedRoute>} />
            <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><MobProfile /></ProtectedRoute>} />

            {/* Doctor Routes */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><Navigate to="/doctor/schedule" /></ProtectedRoute>} />
            <Route path="/doctor/schedule" element={<ProtectedRoute allowedRoles={['doctor']}><MobDocSchedule /></ProtectedRoute>} />
            <Route path="/doctor/appt/:id" element={<ProtectedRoute allowedRoles={['doctor']}><MobDocApptDetail /></ProtectedRoute>} />
            <Route path="/doctor/appt/:id/note" element={<ProtectedRoute allowedRoles={['doctor']}><MobDocNote /></ProtectedRoute>} />
            <Route path="/doctor/hours" element={<ProtectedRoute allowedRoles={['doctor']}><MobDocHours /></ProtectedRoute>} />
            <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><MobProfile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/patients" /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><DeskPatientSearch /></ProtectedRoute>} />
            <Route path="/admin/depts" element={<ProtectedRoute allowedRoles={['admin']}><DeskDepartments /></ProtectedRoute>} />
            <Route path="/admin/docs" element={<ProtectedRoute allowedRoles={['admin']}><DeskDoctors /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><DeskAnalytics /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><DeskSettings /></ProtectedRoute>} />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>

        {/* Global Overlays */}
        {authStatus === 'authenticated' && <TourOverlay />}
      </div>
    </BrowserRouter>
  )
}
