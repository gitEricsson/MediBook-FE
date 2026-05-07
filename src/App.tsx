import { Suspense, lazy, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MB } from '@/constants/tokens'
import { LoadingDots } from '@/components/feedback/LoadingDots'
import { TourOverlay } from '@/features/onboarding/TourOverlay'
import { TweaksPanel, TweakToggle, TweakSelect } from '@/tweaks'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'

// ── Lazy load feature screens ───────────────────────────────────────────

// Auth
const MobLogin = lazy(() => import('@/features/auth/MobLogin'))
const MobRegister = lazy(() => import('@/features/auth/MobRegister'))

// Patient
const MobSearch = lazy(() => import('@/features/patient/MobSearch'))
const MobMyAppts = lazy(() => import('@/features/patient/MobMyAppts'))
const MobProfile = lazy(() => import('@/features/patient/MobProfile'))

// Doctor
const MobDocSchedule = lazy(() => import('@/features/doctor/MobDocSchedule'))
const MobDocHours = lazy(() => import('@/features/doctor/MobDocHours'))

// Admin
const DeskPatientSearch = lazy(() => import('@/features/admin/DeskPatientSearch'))
const DeskDepartments = lazy(() => import('@/features/admin/DeskDepartments'))
const DeskDoctors = lazy(() => import('@/features/admin/DeskDoctors'))
const DeskAnalytics = lazy(() => import('@/features/admin/DeskAnalytics'))
const DeskCapacity = lazy(() => import('@/features/admin/DeskCapacity'))
const DeskSettings = lazy(() => import('@/features/admin/DeskSettings'))

// ── Query Client ────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ── Root Component ──────────────────────────────────────────────────────

export default function App() {
  const { role, login } = useAuthStore()
  const { activeSection } = useAppStore()

  // For demonstration, we'll use a simple state-based switcher.
  // In a real app, this would be react-router-dom <Routes>.
  const [view, setView] = useState<'login' | 'register' | 'app'>('login')

  const handleLogin = (r: 'patient' | 'doctor' | 'admin') => {
    login('user-1', r, 'user@example.com')
    setView('app')
  }

  // Design Tweak State
  const [showTour, setShowTour] = useState(true)
  const [theme, setTheme] = useState('Default')

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mb" style={{ width: '100%', height: '100%', position: 'relative' }}>
        
        <Suspense fallback={
          <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: MB.bg2 }}>
            <LoadingDots />
          </div>
        }>
          {view === 'login' && <MobLogin />}
          {view === 'register' && <MobRegister />}
          
          {view === 'app' && (
            <>
              {/* Role-based entry points for prototype navigation */}
              {role === 'patient' && (
                <>
                  {activeSection === 'home' && <MobSearch />}
                  {activeSection === 'search' && <MobSearch />}
                  {activeSection === 'appts' && <MobMyAppts />}
                  {activeSection === 'profile' && <MobProfile />}
                </>
              )}
              
              {role === 'doctor' && (
                <>
                  {activeSection === 'schedule' && <MobDocSchedule />}
                  {activeSection === 'hours' && <MobDocHours />}
                  {activeSection === 'profile' && <MobProfile />}
                </>
              )}
              
              {role === 'admin' && (
                <>
                  {activeSection === 'home' && <DeskPatientSearch />}
                  {activeSection === 'depts' && <DeskDepartments />}
                  {activeSection === 'docs' && <DeskDoctors />}
                  {activeSection === 'analytics' && <DeskAnalytics />}
                  {activeSection === 'capacity' && <DeskCapacity />}
                  {activeSection === 'settings' && <DeskSettings />}
                </>
              )}
            </>
          )}
        </Suspense>

        {/* Global Overlays */}
        {showTour && <TourOverlay />}
        
        {/* Development Tooling */}
        <TweaksPanel>
          <TweakSelect 
            label="Role (Prototype)" 
            value={role || 'Select...'} 
            options={['Select...', 'patient', 'doctor', 'admin']} 
            onChange={(v) => handleLogin(v as any)} 
          />
          <TweakSelect 
            label="Theme" 
            value={theme} 
            options={['Default', 'High Contrast', 'Dark (WIP)']} 
            onChange={setTheme} 
          />
          <TweakToggle 
            label="Show Onboarding" 
            value={showTour} 
            onChange={setShowTour} 
          />
          <div style={{ padding: '8px 12px', fontSize: 11, color: MB.text3, borderTop: `1px solid ${MB.line2}`, marginTop: 8 }}>
            MediBook Sandbox
          </div>
        </TweaksPanel>
      </div>
    </QueryClientProvider>
  )
}
