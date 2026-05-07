// Runtime MB design token values — single source of truth
export const MB = {
  primary: '#0E8A5F',
  primary600: '#0B7651',
  primary700: '#086043',
  primary50: '#ECFAF3',
  primary100: '#D1F1E0',
  ink: '#0B1220',
  text: '#111827',
  text2: '#4B5563',
  text3: '#6B7280',
  text4: '#9CA3AF',
  line: '#E5E7EB',
  line2: '#EEF0F3',
  bg: '#FFFFFF',
  bg2: '#F7F8FA',
  bg3: '#F1F3F6',
  success: '#0F9D58',
  successBg: '#E6F6EE',
  warn: '#B45309',
  warnBg: '#FEF3C7',
  danger: '#B42318',
  dangerBg: '#FEE4E2',
} as const

export type MBTokenKey = keyof typeof MB
