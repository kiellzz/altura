import { AudiencePaths } from './components/AudiencePaths'
import { AppPlaceholder } from './components/AppPlaceholder'
import { AuthPage } from './components/AuthPage'
import { EditProfilePage } from './components/EditProfilePage'
import { ExplorarRodadasPage } from './components/ExplorarRodadasPage'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { LoadingScreen } from './components/LoadingScreen'
import { OnboardingPage } from './components/OnboardingPage'
import { Segments } from './components/Segments'
import { useEffect, useState } from 'react'
import { useAuth } from './auth/useAuth'
import type { TipoUsuario } from './data/landing'

type Route =
  | { page: 'home' }
  | { page: 'login' }
  | { page: 'register'; role?: TipoUsuario }
  | { page: 'onboarding' }
  | { page: 'app' }
  | { page: 'edit-profile' }
  | { page: 'explorar-rodadas' }

function getTipoFromQuery(search = window.location.search): TipoUsuario | undefined {
  const tipo = new URLSearchParams(search).get('tipo')
  return tipo === 'startup' || tipo === 'investidor' ? tipo : undefined
}

function getRoute(pathname = window.location.pathname, search = window.location.search): Route {
  if (pathname === '/login') return { page: 'login' }
  if (pathname === '/cadastro/startup') return { page: 'register', role: 'startup' }
  if (pathname === '/cadastro/investidor') return { page: 'register', role: 'investidor' }
  if (pathname === '/cadastro') return { page: 'register', role: getTipoFromQuery(search) }
  if (pathname === '/onboarding') return { page: 'onboarding' }
  if (pathname === '/app') return { page: 'app' }
  if (pathname === '/editar-perfil') return { page: 'edit-profile' }
  if (pathname === '/explorar-rodadas') return { page: 'explorar-rodadas' }
  return { page: 'home' }
}

export default function App() {
  const { status } = useAuth()
  const [route, setRoute] = useState<Route>(() => getRoute())

  const navigate = (to: string) => {
    window.history.pushState({}, '', to)
    setRoute(getRoute(window.location.pathname, window.location.search))
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute())

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return

      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) return

      const isAppRoute = ['/', '/login', '/cadastro', '/cadastro/startup', '/cadastro/investidor', '/onboarding', '/app', '/editar-perfil', '/explorar-rodadas'].includes(url.pathname)
      const isSectionLink = url.pathname === '/' && url.hash.length > 0
      if (!isAppRoute && !isSectionLink) return

      event.preventDefault()
      window.history.pushState({}, '', `${url.pathname}${url.hash}`)
      syncRoute()

      if (url.hash) {
        requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView())
      } else {
        window.scrollTo({ top: 0 })
      }
    }

    window.addEventListener('popstate', syncRoute)
    document.addEventListener('click', onClick)

    return () => {
      window.removeEventListener('popstate', syncRoute)
      document.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    const isAuthRoute = route.page === 'login' || route.page === 'register'
    const isProtectedRoute = route.page === 'app' || route.page === 'onboarding' || route.page === 'edit-profile' || route.page === 'explorar-rodadas'

    if (status === 'signedOut' && isProtectedRoute) {
      navigate('/login')
      return
    }

    if (status === 'needsProfile') {
      if (route.page !== 'onboarding' && (isAuthRoute || route.page === 'app' || route.page === 'edit-profile' || route.page === 'explorar-rodadas')) navigate('/onboarding')
      return
    }

    if (status === 'ready') {
      if (isAuthRoute || route.page === 'onboarding') navigate('/app')
    }
  }, [route.page, status])

  const isHome = route.page === 'home'
  const shouldShowProtectedLoading = status === 'loading' && (route.page === 'app' || route.page === 'onboarding')

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      {shouldShowProtectedLoading ? (
        <LoadingScreen />
      ) : isHome ? (
        <div className="landing-shell">
          <Header />
          <main id="conteudo">
            <Hero />
            <HowItWorks />
            <AudiencePaths />
            <Segments />
            <Faq />
            <FinalCta />
          </main>
          <Footer />
        </div>
      ) : route.page === 'app' ? (
        <AppPlaceholder onExcluido={() => navigate('/onboarding?aviso=perfil-excluido')} />
      ) : route.page === 'onboarding' ? (
        <OnboardingPage onComplete={() => navigate('/app')} />
      ) : route.page === 'edit-profile' ? (
        <EditProfilePage onCancel={() => navigate('/app')} onSave={() => navigate('/app')} />
      ) : route.page === 'explorar-rodadas' ? (
        <ExplorarRodadasPage onBack={() => navigate('/app')} />
      ) : (
        <AuthPage mode={route.page === 'login' ? 'login' : 'register'} initialRole={route.page === 'register' ? route.role : undefined} />
      )}
    </>
  )
}
