import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  activeSection: string
  toggleSidebar: () => void
  setActiveSection: (section: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  activeSection: 'home',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
}))
