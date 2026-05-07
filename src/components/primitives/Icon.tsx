import { memo } from 'react'
import type { IconName } from '@/types/ui'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}

const PATHS: Record<IconName, React.ReactNode> = {
  search:       <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
  calendar:     <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  clock:        <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  user:         <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>,
  bell:         <><path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5L6 16z"/><path d="M10 21h4"/></>,
  chevronRight: <path d="M9 6l6 6-6 6"/>,
  chevronLeft:  <path d="M15 6l-9 6 9 6"/>,
  chevronDown:  <path d="M6 9l6 6 6-6"/>,
  plus:         <path d="M12 5v14M5 12h14"/>,
  check:        <path d="M5 13l4 4L19 7"/>,
  x:            <path d="M6 6l12 12M18 6L6 18"/>,
  eye:          <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  filter:       <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z"/>,
  pin:          <><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></>,
  edit:         <path d="M14 4l6 6L8 22H2v-6L14 4z"/>,
  trash:        <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></>,
  home:         <><path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
  grid:         <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  chart:        <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19 12c0 .5-.1 1-.2 1.5l2 1.6-2 3.4-2.4-1c-.8.6-1.6 1-2.5 1.3l-.4 2.6h-4l-.4-2.6c-.9-.3-1.7-.7-2.5-1.3l-2.4 1-2-3.4 2-1.6c-.1-.5-.2-1-.2-1.5s.1-1 .2-1.5l-2-1.6 2-3.4 2.4 1c.8-.6 1.6-1 2.5-1.3L10 3h4l.4 2.6c.9.3 1.7.7 2.5 1.3l2.4-1 2 3.4-2 1.6c.1.5.2 1 .2 1.5z"/></>,
  stethoscope:  <><path d="M5 3v6a4 4 0 008 0V3"/><path d="M9 13v3a4 4 0 008 0v-2"/><circle cx="17" cy="13" r="2"/></>,
  inbox:        <><path d="M3 13l3-9h12l3 9v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z"/><path d="M3 13h5l1 3h6l1-3h5"/></>,
  info:         <><circle cx="12" cy="12" r="9"/><path d="M12 8v0M12 11v6"/></>,
  alert:        <><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17v0"/></>,
  sparkle:      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"/>,
  arrowRight:   <path d="M5 12h14M13 6l6 6-6 6"/>,
  download:     <><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></>,
  moreH:        <><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></>,
  moreV:        <><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></>,
  lock:         <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>,
  mail:         <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>,
  phone:        <path d="M5 4h4l2 5-3 2c1 2.5 3 4.5 5.5 5.5l2-3 5 2v4c0 .5-.5 1-1 1C9 20 4 15 4 5c0-.5.5-1 1-1z"/>,
  building:     <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/></>,
  users:        <><circle cx="9" cy="8" r="4"/><path d="M2 21c1-4 3.5-6 7-6s6 2 7 6"/><path d="M16 11a4 4 0 000-7M22 21c-.5-3-2-5-5-5.5"/></>,
  logout:       <><path d="M14 8V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1h9a1 1 0 001-1v-3"/><path d="M21 12H10M17 8l4 4-4 4"/></>,
}

export const Icon = memo(function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {PATHS[name] ?? null}
    </svg>
  )
})
