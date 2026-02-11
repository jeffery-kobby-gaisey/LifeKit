import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('life-os-dark-mode')
    if (stored !== null) return stored === 'true'
    return false
  })

  // Apply/remove dark class whenever isDark changes
  useEffect(() => {
    localStorage.setItem('life-os-dark-mode', String(isDark))
    
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#111827' // gray-900
      document.body.style.color = '#f3f4f6' // gray-100
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#ffffff' // white
      document.body.style.color = '#111827' // gray-900
    }
  }, [isDark])

  // Initialize on mount
  useEffect(() => {
    const stored = localStorage.getItem('life-os-dark-mode')
    const initialDark = stored === 'true'
    
    if (initialDark) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#111827'
      document.body.style.color = '#f3f4f6'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#111827'
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
