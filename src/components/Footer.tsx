import { navItems } from '../data/landing'
import { Brand } from './Brand'

export function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>Conexões claras entre quem está construindo e quem quer investir.</p>
        </div>
        <nav aria-label="Navegação do rodapé">
          {navItems.filter((item) => item.href !== '#segmentos').map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          <a href="/login">Entrar</a>
        </nav>
      </div>
      <div className="container footer-bottom"><span>© 2026 Altura</span><span>Startups e investidores, conectados.</span></div>
    </footer>
  )
}
