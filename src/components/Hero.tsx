import type { CSSProperties } from 'react'
import { ArrowRight, HandCoins, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import heroMp4 from '../assets/handshake-hero.mp4'
import heroWebm from '../assets/handshake-hero.webm'
import heroPoster from '../assets/hero-poster.jpg'
import startupImage from '../assets/generic_Startup.png'
import {
  captacaoExemplo,
  currencyFormatter,
  hero,
  percentFormatter,
  segmentos,
  startupExemplo,
} from '../data/landing'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export function Hero() {
  const reducedMotion = useReducedMotion()
  const segmento = segmentos.find((item) => item.id === startupExemplo.segmento_id)
  const progress = Math.round((captacaoExemplo.valor_captado / captacaoExemplo.valor_alvo) * 100)

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title">{hero.title}</h1>
          <p className="hero-description">{hero.description}</p>
          <div className="hero-actions">
            {hero.actions.map((action) => (
              <div className="hero-action" key={action.type}>
                <a className={`button button-${action.type === 'startup' ? 'navy' : 'teal'}`} href={action.href}>
                  {action.label}<ArrowRight size={18} aria-hidden="true" />
                </a>
                <span>{action.helper}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="video-frame">
            {reducedMotion ? (
              <img src={heroPoster} width="1280" height="720" alt="Duas pessoas conversando em uma mesa de negociação" />
            ) : (
              <video autoPlay muted loop playsInline preload="metadata" poster={heroPoster} aria-label="Duas pessoas conversando em uma mesa de negociação">
                <source src={heroWebm} type="video/webm" />
                <source src={heroMp4} type="video/mp4" />
              </video>
            )}
            <div className="video-overlay" aria-hidden="true" />
          </div>
          <div className="round-card">
            <div className="round-card-top">
              <span className="illustrative">Exemplo ilustrativo</span>
              <span className="status-chip"><span />Rodada aberta</span>
            </div>
            <div className="startup-preview">
              <img src={startupImage} width="56" height="56" alt="Imagem genérica de startup" />
              <div>
                <h2>{startupExemplo.nome}</h2>
                <p>{segmento?.nome} <span aria-hidden="true">•</span> Fase: {startupExemplo.fase}</p>
              </div>
            </div>
            <div className="round-metrics">
              <div><span>Meta</span><strong>{currencyFormatter.format(captacaoExemplo.valor_alvo)}</strong></div>
              <div><span>Equity oferecido</span><strong>{percentFormatter.format(captacaoExemplo.percentual_equity_oferecido)}%</strong></div>
            </div>
            <div className="progress-label"><span>Progresso da rodada</span></div>
            <div className="progress-wrap">
              <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progresso da rodada">
                <span style={{ width: `${progress}%` }} />
              </div>
              <strong className="progress-value" style={{ '--progress-left': `${progress}%` } as CSSProperties}>{progress}%</strong>
            </div>
            <p className="captured">{currencyFormatter.format(captacaoExemplo.valor_captado)} captados</p>
            <div className="round-actions" aria-label="Ações ilustrativas da rodada">
              <button className="round-action-primary" type="button">
                <HandCoins size={17} aria-hidden="true" />
                Fazer proposta
              </button>
              <button className="round-action-secondary" type="button">
                <Info size={17} aria-hidden="true" />
                Mais detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
