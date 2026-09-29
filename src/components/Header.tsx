import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { signOut } from '../auth/authApi'
import { useAuth } from '../auth/useAuth'
import { navItems } from '../data/landing'
import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'

const focusableSelector = 'a[href], button:not([disabled])'

export function Header() {
  const { status, usuario } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const isHome = window.location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
    focusable[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)
  const isLoggedIn = status === 'needsProfile' || status === 'ready'
  const accessHref = status === 'needsProfile' ? '/onboarding' : '/app'

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="desktop-actions">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <span className="user-greeting">Olá, {usuario?.nome || 'bem-vindo(a)'}!</span>
              <a className="button button-navy button-compact" href={accessHref}>Acessar a Altura</a>
              <button className="button button-ghost button-compact" type="button" onClick={() => void signOut()}>Sair</button>
            </>
          ) : (
            <>
              <a className="button button-ghost" href="/login">Entrar</a>
              <a className="button button-navy button-compact" href="/cadastro">Criar conta</a>
            </>
          )}
        </div>
        <button
          ref={triggerRef}
          className="menu-trigger"
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <Menu aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="mobile-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <div ref={dialogRef} id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu principal">
            <div className="mobile-menu-top">
              <Brand />
              <button className="menu-trigger" type="button" aria-label="Fechar menu" onClick={close}>
                <X aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navegação móvel">
              {navItems.map((item) => <a key={item.href} href={item.href} onClick={close}>{item.label}</a>)}
            </nav>
            <div className="mobile-actions">
              <ThemeToggle showLabel />
              {isLoggedIn ? (
                <>
                  <p className="mobile-greeting">Olá, {usuario?.nome || 'bem-vindo(a)'}!</p>
                  <a className="button button-navy" href={accessHref} onClick={close}>Acessar a Altura</a>
                  <button className="button button-outline" type="button" onClick={() => { close(); void signOut() }}>Sair</button>
                </>
              ) : (
                <>
                  <a className="button button-outline" href="/login" onClick={close}>Entrar</a>
                  <a className="button button-navy" href="/cadastro" onClick={close}>Criar conta</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
