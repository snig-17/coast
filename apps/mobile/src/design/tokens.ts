export const colors = {
  sand: '#E9E4D8',
  card: '#F2EEE4',
  ink: '#1A1A1A',
  inkMuted: '#6B6B63',
  line: '#D8D2C4',
  teal: '#0F6E6E',
  green: '#2E7D5B',
  amber: '#D98A3D',
  overPace: '#E4694E',
  tabBar: '#111111',
  onDark: '#F2EEE4',
  tabInactive: '#6E6E6E',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const type = {
  hero:  { family: 'Archivo_800ExtraBold', size: 56, line: 60 },
  title: { family: 'Archivo_700Bold',      size: 28, line: 32 },
  stat:  { family: 'Archivo_700Bold',      size: 34, line: 38 },
  label: { family: 'Inter_600SemiBold',    size: 13, line: 16, letter: 1 },
  body:  { family: 'Inter_400Regular',     size: 16, line: 22 },
} as const;
