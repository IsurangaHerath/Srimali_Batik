import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('srimali-theme') as Theme | null
      if (stored) return stored
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })(),
  setTheme: (theme) => {
    localStorage.setItem('srimali-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => {
    const next = useThemeStore.getState().theme === 'light' ? 'dark' : 'light'
    useThemeStore.getState().setTheme(next)
  },
}))

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('srimali-theme') as Theme | null
  const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', theme === 'dark')
}