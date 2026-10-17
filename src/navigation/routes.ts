import type { TipoUsuario } from '../data/landing'

export type Route =
  | { page: 'home' }
  | { page: 'login' }
  | { page: 'register'; role?: TipoUsuario }
  | { page: 'onboarding' }
  | { page: 'app' }
  | { page: 'edit-profile' }
  | { page: 'explorar-rodadas' }
  | { page: 'manage-rounds' }
  | { page: 'feed' }
  | { page: 'startup-profile'; userId: string; postId?: number }
  | { page: 'conversations' }
  | { page: 'intelligence' }

export const protectedPages = new Set<Route['page']>([
  'onboarding',
  'app',
  'edit-profile',
  'explorar-rodadas',
  'manage-rounds',
  'feed',
  'startup-profile',
  'conversations',
  'intelligence',
])

export function parseRoute(pathname = window.location.pathname, search = window.location.search): Route {
  if (pathname === '/login') return { page: 'login' }
  if (pathname === '/cadastro/startup') return { page: 'register', role: 'startup' }
  if (pathname === '/cadastro/investidor') return { page: 'register', role: 'investidor' }
  if (pathname === '/cadastro') {
    const tipo = new URLSearchParams(search).get('tipo')
    return { page: 'register', role: tipo === 'startup' || tipo === 'investidor' ? tipo : undefined }
  }
  if (pathname === '/onboarding') return { page: 'onboarding' }
  if (pathname === '/app/intelligence') return { page: 'intelligence' }
  if (pathname === '/app') return { page: 'app' }
  if (pathname === '/editar-perfil') return { page: 'edit-profile' }
  if (pathname === '/explorar-rodadas') return { page: 'explorar-rodadas' }
  if (pathname === '/rodadas') return { page: 'manage-rounds' }
  if (pathname === '/feed') return { page: 'feed' }
  if (pathname === '/conversas') return { page: 'conversations' }
  const startupProfileMatch = pathname.match(/^\/startups\/([^/]+)$/)
  if (startupProfileMatch) {
    const post = Number(new URLSearchParams(search).get('post'))
    return { page: 'startup-profile', userId: decodeURIComponent(startupProfileMatch[1]), ...(Number.isInteger(post) && post > 0 ? { postId: post } : {}) }
  }
  return { page: 'home' }
}

export function isKnownAppUrl(url: URL) {
  return [
    '/', '/login', '/cadastro', '/cadastro/startup', '/cadastro/investidor',
    '/onboarding', '/app', '/app/intelligence', '/editar-perfil', '/explorar-rodadas', '/rodadas', '/feed', '/conversas',
  ].includes(url.pathname) || /^\/startups\/[^/]+$/.test(url.pathname)
}

export function routeKey(route: Route) {
  return route.page === 'startup-profile' ? `${route.page}:${route.userId}:${route.postId ?? ''}` : route.page
}
