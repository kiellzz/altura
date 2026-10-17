import { LayoutDashboard, Menu, MessageCircle, Megaphone, Rocket, Settings, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'

const commonItems = [
  { href: '/app', label: 'Painel', icon: LayoutDashboard },
  { href: '/feed', label: 'Feed de tração', icon: Megaphone },
  { href: '/conversas', label: 'Conexões e conversas', icon: MessageCircle },
  { href: '/editar-perfil', label: 'Editar perfil', icon: Settings },
]

export function DashboardNavMenu() {
  const { usuario } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = window.location.pathname
  const items = usuario?.tipo === 'investidor'
    ? [...commonItems.slice(0, 2), { href: '/explorar-rodadas', label: 'Explorar rodadas', icon: Rocket }, ...commonItems.slice(2)]
    : [{ href: '/app/intelligence', label: 'Altura Intelligence (BETA)', icon: Sparkles }, ...commonItems.slice(0, 2), { href: '/rodadas', label: 'Gerenciar rodada', icon: Rocket }, ...commonItems.slice(2)]

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="dashboard-nav-menu" ref={containerRef}>
      <button
        className={`dashboard-nav-trigger${open ? ' is-open' : ''}`}
        type="button"
        aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        aria-expanded={open}
        aria-controls="dashboard-main-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={23} aria-hidden="true" /> : <Menu size={25} aria-hidden="true" />}
      </button>

      {open && (
        <nav id="dashboard-main-navigation" className="dashboard-nav-popover" aria-label="Navegação principal">
          <p className="dashboard-nav-title">Navegação</p>
          <div className="dashboard-nav-links">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <a
                  key={href}
                  className={`dashboard-nav-link${active ? ' is-active' : ''}`}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="dashboard-nav-link-icon"><Icon size={18} aria-hidden="true" /></span>
                  <span>{label}</span>
                </a>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
