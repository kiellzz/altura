import { segmentos } from '../data/landing'
import { Reveal } from './Reveal'
import { SegmentIcon } from './SegmentIcon'

export function Segments() {
  return (
    <section id="segmentos" className="section" aria-labelledby="segments-title">
      <div className="container segments-layout">
        <Reveal className="section-heading section-heading-left">
          <p className="kicker">Afinidade importa</p>
          <h2 id="segments-title">Segmentos para todo tipo de tese.</h2>
          <p>Explore áreas de interesse e encontre rodadas mais próximas do que você procura.</p>
          <small>Lista ilustrativa.</small>
        </Reveal>
        <Reveal className="segment-cloud" delay={80}>
          {segmentos.map((segmento, index) => (
            <button type="button" className={index === 0 || index === 5 ? 'is-highlighted' : ''} key={segmento.id}>
              <SegmentIcon nome={segmento.nome} />
              {segmento.nome}
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
