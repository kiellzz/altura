import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'

const themeToggleVisible = false

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  if (!themeToggleVisible) return null

  const isDark = theme === 'dark'
  const nextThemeLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro'

  return (
    <button
      className={`theme-toggle ${showLabel ? 'theme-toggle-with-label' : ''}`}
      type="button"
      aria-label={nextThemeLabel}
      aria-pressed={isDark}
      title={nextThemeLabel}
      onClick={toggleTheme}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      {showLabel && <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>}
    </button>
  )
}
