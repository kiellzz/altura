import { lazy, Suspense } from 'react'
import { AudiencePaths } from './components/AudiencePaths'
import { AppLoader } from './components/AppLoader'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { PageTransition } from './components/PageTransition'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { RouteLoader } from './components/RouteLoader'
import { Segments } from './components/Segments'
import { useNavigation } from './navigation/NavigationContext'
import { routeKey } from './navigation/routes'

const AuthPage = lazy(() => import('./components/AuthPage').then((module) => ({ default: module.AuthPage })))
const AppPlaceholder = lazy(() => import('./components/AppPlaceholder').then((module) => ({ default: module.AppPlaceholder })))
const OnboardingPage = lazy(() => import('./components/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const EditProfilePage = lazy(() => import('./components/EditProfilePage').then((module) => ({ default: module.EditProfilePage })))
const ExplorarRodadasPage = lazy(() => import('./components/ExplorarRodadasPage').then((module) => ({ default: module.ExplorarRodadasPage })))
const RoundsManagementPage = lazy(() => import('./components/RoundsManagementPage').then((module) => ({ default: module.RoundsManagementPage })))
const FeedPage = lazy(() => import('./components/FeedPage').then((module) => ({ default: module.FeedPage })))
const StartupPublicProfilePage = lazy(() => import('./components/StartupPublicProfilePage').then((module) => ({ default: module.StartupPublicProfilePage })))
const ConversationsPage = lazy(() => import('./components/ConversationsPage').then((module) => ({ default: module.ConversationsPage })))
const IntelligencePage = lazy(() => import('./components/IntelligencePage').then((module) => ({ default: module.IntelligencePage })))

export default function App() {
  const { route, direction, isNavigating, isFetching, navigate } = useNavigation()
  const currentRouteKey = routeKey(route)

  const page = route.page === 'home' ? (
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
  ) : route.page === 'manage-rounds' ? (
    <RoundsManagementPage onBack={() => navigate('/app')} />
  ) : route.page === 'feed' ? (
    <FeedPage onBack={() => navigate('/app')} onOpenStartup={(userId) => navigate(`/startups/${userId}`)} />
  ) : route.page === 'startup-profile' ? (
    <StartupPublicProfilePage startupUserId={route.userId} postId={route.postId} onBack={() => navigate('/feed')} onOpenConversations={() => navigate('/conversas')} />
  ) : route.page === 'conversations' ? (
    <ConversationsPage onBack={() => navigate('/app')} onOpenStartup={(userId) => navigate(`/startups/${userId}`)} />
  ) : route.page === 'intelligence' ? (
    <IntelligencePage onBack={() => navigate('/app')} />
  ) : (
    <AuthPage mode={route.page === 'login' ? 'login' : 'register'} initialRole={route.page === 'register' ? route.role : undefined} />
  )

  return (
    <div className={`app-navigation-root${route.page === 'home' ? '' : ' app-navigation-root--internal'}`} aria-busy={isNavigating || isFetching}>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <ProtectedRoute route={route}>
        <RouteErrorBoundary routeKey={currentRouteKey}>
          <Suspense fallback={<AppLoader message="Carregando página..." />}>
            <PageTransition key={currentRouteKey} routeKey={currentRouteKey} direction={direction}>{page}</PageTransition>
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
      <RouteLoader navigating={isNavigating} fetching={isFetching} />
    </div>
  )
}
