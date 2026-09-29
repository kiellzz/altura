import { ArrowLeft, ArrowRight, Building2, DollarSign, Filter, Globe, Info, MapPin, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import genericStartupImage from '../assets/generic_Startup.png'
import { useAuth } from '../auth/useAuth'
import { carregarRodadasAbertas, type RodadaDisponivelData } from '../lib/perfilApi'
import { Brand } from './Brand'
import { RangeSlider } from './RangeSlider'
import { SegmentIcon } from './SegmentIcon'
import { ThemeToggle } from './ThemeToggle'
import linkedinLogo from '../assets/svg/linkedin-svgrepo-com.svg'

interface ExplorarRodadasPageProps { onBack: () => void }
const fases = ['Ideação', 'MVP', 'Tração', 'Escala']

export function ExplorarRodadasPage({ onBack }: ExplorarRodadasPageProps) {
  const { usuario } = useAuth()
  const [rodadas, setRodadas] = useState<RodadaDisponivelData[]>([])
  const [segmentos, setSegmentos] = useState<string[]>([])
  const [filtroSegmento, setFiltroSegmento] = useState('todos')
  const [filtroFase, setFiltroFase] = useState('todas')
  const [filtroTicketMin, setFiltroTicketMin] = useState(0)
  const [filtroTicketMax, setFiltroTicketMax] = useState(10000000)
  const [filtroEquityMin, setFiltroEquityMin] = useState(0)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rodadaSelecionada, setRodadaSelecionada] = useState<RodadaDisponivelData | null>(null)

  useEffect(() => {
    let active = true
    void carregarRodadasAbertas().then((items) => {
      if (!active) return
      setRodadas(items)
      setSegmentos([...new Set(items.map((item) => item.startup.segmentoNome))].sort())
    }).catch(() => {
      if (active) setLoadError('Não foi possível carregar as rodadas. Tente novamente.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const filtrosAtivos = busca !== '' || filtroSegmento !== 'todos' || filtroFase !== 'todas' || filtroTicketMin !== 0 || filtroTicketMax !== 10000000 || filtroEquityMin !== 0

  const limparFiltros = () => {
    setFiltroSegmento('todos')
    setFiltroFase('todas')
    setFiltroTicketMin(0)
    setFiltroTicketMax(10000000)
    setFiltroEquityMin(0)
    setBusca('')
  }

  const rodadasFiltradas = rodadas.filter((rodada) => {
    const startup = rodada.startup
    return (!busca || startup.nomeStartup.toLowerCase().includes(busca.toLowerCase()))
      && (filtroSegmento === 'todos' || startup.segmentoNome === filtroSegmento)
      && (filtroFase === 'todas' || startup.fase === filtroFase)
      && rodada.valorAlvo >= filtroTicketMin
      && rodada.valorAlvo <= filtroTicketMax
      && (filtroEquityMin === 0 || rodada.percentualEquityOferecido >= filtroEquityMin)
  })

  if (usuario?.tipo !== 'investidor') return <main id="conteudo" className="dashboard-shell"><header className="dashboard-header"><div className="dashboard-header-content"><div className="dashboard-brand"><Brand /><div className="dashboard-user-info"><p className="kicker">Acesso Restrito</p><h1>Área exclusiva para investidores</h1></div></div><div className="dashboard-actions"><ThemeToggle /><button className="button button-ghost button-compact" type="button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" /><span>Voltar</span></button></div></div></header><div className="dashboard-content"><section className="dashboard-section"><div className="access-denied"><Building2 size={48} aria-hidden="true" /><h3>Acesso exclusivo para investidores</h3><p>Esta funcionalidade está disponível apenas para perfis de investidor.</p></div></section></div></main>

  return <main id="conteudo" className="dashboard-shell">
    <header className="dashboard-header"><div className="dashboard-header-content"><div className="dashboard-brand"><Brand /><div className="dashboard-user-info"><p className="kicker">Explorar Rodadas</p><h1>Encontre oportunidades de investimento</h1></div></div><div className="dashboard-actions"><ThemeToggle /><button className="button button-ghost button-compact" type="button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" /><span>Voltar</span></button></div></div></header>
    <div className="dashboard-content">
      <section className="dashboard-section">
        <div className="filtros-panel">
          <div className="filtros-panel-header">
            <div className="filtros-panel-heading">
              <span className="filtros-panel-icon" aria-hidden="true"><SlidersHorizontal size={20} /></span>
              <div className="filtros-panel-copy">
                <p className="kicker">Refine sua busca</p>
                <h2>Filtros avançados</h2>
                <p className="filtros-panel-description">Combine critérios para encontrar as oportunidades mais alinhadas à sua tese de investimento.</p>
              </div>
            </div>
            <button className="button button-outline button-compact filtros-clear" type="button" onClick={limparFiltros} disabled={!filtrosAtivos}><Filter size={17} aria-hidden="true" />Limpar filtros</button>
          </div>
          <div className="filtros-grid">
            <div className="filtro-grupo"><label>Buscar</label><div className="search-input"><Search size={18} aria-hidden="true" /><input type="text" placeholder="Nome da startup..." value={busca} onChange={(event) => setBusca(event.target.value)} /></div></div>
            <div className="filtro-grupo"><label>Segmento</label><select value={filtroSegmento} onChange={(event) => setFiltroSegmento(event.target.value)}><option value="todos">Todos os segmentos</option>{segmentos.map((segmento) => <option key={segmento} value={segmento}>{segmento}</option>)}</select></div>
            <div className="filtro-grupo"><label>Fase</label><select value={filtroFase} onChange={(event) => setFiltroFase(event.target.value)}><option value="todas">Todas as fases</option>{fases.map((fase) => <option key={fase} value={fase}>{fase}</option>)}</select></div>
            <div className="filtro-grupo"><label>Equity mínimo (%)</label><div className="valor-input"><DollarSign size={18} aria-hidden="true" /><input type="number" min={0} max={49.9} value={filtroEquityMin} onChange={(event) => setFiltroEquityMin(Number(event.target.value))} /></div></div>
            <div className="filtro-grupo filtro-grupo-ticket"><label>Faixa de ticket</label><RangeSlider min={0} max={10000000} step={50000} valueMin={filtroTicketMin} valueMax={filtroTicketMax} onChange={(min, max) => { setFiltroTicketMin(min); setFiltroTicketMax(max) }} hideLabel /></div>
          </div>
        </div>
      </section>
      <section className="dashboard-section"><div className="section-header"><h2>Rodadas disponíveis</h2><p className="section-description">{loading ? 'Carregando rodadas...' : `${rodadasFiltradas.length} rodada${rodadasFiltradas.length === 1 ? '' : 's'} encontrada${rodadasFiltradas.length === 1 ? '' : 's'}`}</p></div>
        {loadError ? <EmptyState title="Não foi possível carregar as rodadas" text={loadError} /> : !loading && rodadasFiltradas.length === 0 ? <EmptyState title="Nenhuma rodada encontrada" text="Não há oportunidades reais que correspondam aos filtros atuais." /> : <div className="rodadas-grid">{rodadasFiltradas.map((rodada) => <RodadaCard key={rodada.id} rodada={rodada} onDetails={() => setRodadaSelecionada(rodada)} />)}</div>}
      </section>
    </div>
    {rodadaSelecionada && <StartupDetailsModal rodada={rodadaSelecionada} onClose={() => setRodadaSelecionada(null)} />}
  </main>
}

function EmptyState({ title, text }: { title: string; text: string }) { return <div className="activity-placeholder"><div className="activity-empty"><div className="activity-icon"><Search size={48} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p></div></div> }

function RodadaProgresso({ rodada }: { rodada: RodadaDisponivelData }) {
  const progresso = rodada.valorAlvo > 0 ? Math.min(100, Math.round((rodada.valorCaptado / rodada.valorAlvo) * 100)) : 0
  return <div className="rodada-card-progresso"><div className="progresso-header"><span className="progresso-label">Progresso da rodada</span><span className="progresso-porcentagem">{progresso}%</span></div><div className="progresso-bar"><div className="progresso-fill" style={{ width: `${progresso}%` }} /></div><div className="progresso-footer"><span>{formatarMoeda(rodada.valorCaptado)} captados</span></div></div>
}

function RodadaCard({ rodada, onDetails }: { rodada: RodadaDisponivelData; onDetails: () => void }) {
  const { startup } = rodada
  const progresso = rodada.valorAlvo > 0 ? Math.min(100, Math.round((rodada.valorCaptado / rodada.valorAlvo) * 100)) : 0
  const fundacaoTexto = startup.dataFundacao ? `Fundada em ${formatarMesAno(startup.dataFundacao)}` : 'Fundação não informada'
  return <div className="startup-profile-preview-card rodada-preview-card">
    <div className="startup-profile-preview-header">
      <div className="startup-profile-preview-logo"><img src={genericStartupImage} alt={startup.nomeStartup} loading="lazy" /></div>
      <div>
        <h3>{startup.nomeStartup}</h3>
        <p>
          <span className="segment-preview-primary"><SegmentIcon nome={startup.segmentoNome} />{startup.segmentoNome}</span>
          <span className="segment-preview-phase">Fase: {startup.fase}</span>
        </p>
      </div>
      <span className="startup-profile-preview-status is-open">Rodada aberta</span>
    </div>
    <div className="startup-profile-preview-metrics">
      <div><span>Meta</span><strong>{formatarMoeda(rodada.valorAlvo)}</strong></div>
      <div><span>Equity oferecido</span><strong>{rodada.percentualEquityOferecido}%</strong></div>
    </div>
    <div className="startup-profile-preview-progress">
      <div><span>Progresso da rodada</span><strong>{progresso}%</strong></div>
      <div className="startup-profile-preview-progress-bar"><span style={{ width: `${progresso}%` }} /></div>
      <small>{formatarMoeda(rodada.valorCaptado)} captados · {fundacaoTexto}</small>
    </div>
    <div className="startup-profile-preview-match"><TrendingUp size={16} aria-hidden="true" /><span>Match calculado conforme sua tese</span></div>
    <div className="startup-profile-preview-actions"><button className="button button-navy button-compact" type="button" disabled>Fazer proposta<ArrowRight size={16} aria-hidden="true" /></button><button className="button button-outline button-compact" type="button" onClick={onDetails}><Info size={16} aria-hidden="true" />Mais detalhes</button></div>
  </div>
}

function StartupDetailsModal({ rodada, onClose }: { rodada: RodadaDisponivelData; onClose: () => void }) {
  const { startup } = rodada
  const videoEmbedUrl = startup.videoPitchUrl ? getYoutubeEmbedUrl(startup.videoPitchUrl) : null
  return <div className="details-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="startup-details-title"><button className="details-modal-close" type="button" onClick={onClose} aria-label="Fechar detalhes"><X size={20} aria-hidden="true" /></button><div className="details-modal-heading"><div className="rodada-card-logo"><img src={genericStartupImage} alt="" /></div><div><p className="kicker">Detalhes da oportunidade</p><h2 id="startup-details-title">{startup.nomeStartup}</h2><p>{startup.segmentoNome} · Fase: {startup.fase}</p></div></div><div className="details-modal-progress"><div className="rodada-card-metricas"><div className="metrica-box"><span className="metrica-box-label">Meta</span><span className="metrica-box-valor">{formatarMoeda(rodada.valorAlvo)}</span></div></div><RodadaProgresso rodada={rodada} /></div><div className="details-modal-grid"><div><span>Equity oferecido</span><strong>{rodada.percentualEquityOferecido}%</strong></div><div><span>Fundação</span><strong>{formatarMesAno(startup.dataFundacao)}</strong></div></div><div className="details-modal-section details-modal-section--about"><h3>Sobre a startup</h3><p className="details-modal-about-text">{startup.descricao || 'Descrição não informada.'}</p></div>{startup.segmentosSecundarios.length > 0 && <div className="details-modal-section"><h3>Segmentos secundários</h3><div className="details-modal-tags">{startup.segmentosSecundarios.map((segmento) => <span key={segmento}><SegmentIcon nome={segmento} />{segmento}</span>)}</div></div>} {(startup.cidade || startup.estado || startup.siteUrl || startup.linkedinUrl) && <div className="details-modal-section details-modal-section--links"><h3>Informações adicionais</h3><div className="details-modal-links">{(startup.cidade || startup.estado) && <span className="details-modal-link-item"><span className="details-modal-link-icon details-modal-link-icon--muted" aria-hidden="true"><MapPin size={14} /></span><span className="details-modal-link-label">{[startup.cidade, startup.estado].filter(Boolean).join(' - ')}</span></span>}{startup.siteUrl && <a className="details-modal-link-item details-modal-link-item--anchor" href={startup.siteUrl} target="_blank" rel="noreferrer"><span className="details-modal-link-icon details-modal-link-icon--teal" aria-hidden="true"><Globe size={14} /></span><span className="details-modal-link-label">Site da startup</span></a>}{startup.linkedinUrl && <a className="details-modal-link-item details-modal-link-item--anchor" href={startup.linkedinUrl} target="_blank" rel="noreferrer"><span className="details-modal-link-icon details-modal-link-icon--linkedin" aria-hidden="true"><img src={linkedinLogo} alt="" /></span><span className="details-modal-link-label">LinkedIn</span></a>}</div></div>}{videoEmbedUrl && <div className="details-modal-section"><h3>Vídeo de pitch</h3><div className="details-modal-video"><iframe src={videoEmbedUrl} title={`Vídeo de pitch da ${startup.nomeStartup}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></div>}<div className="details-modal-actions"><button className="button button-navy" type="button" disabled>Fazer proposta <ArrowRight size={17} aria-hidden="true" /></button></div></section></div>
}

function getYoutubeEmbedUrl(value: string) { try { const url = new URL(value); const id = url.hostname.includes('youtu.be') ? url.pathname.slice(1) : url.searchParams.get('v') ?? url.pathname.split('/').filter(Boolean).pop(); return id ? `https://www.youtube.com/embed/${id}` : null } catch { return null } }
function formatarMesAno(value: string | null) { if (!value) return 'Não informada'; const date = new Date(`${value.slice(0, 7)}-01T00:00:00`); return Number.isNaN(date.getTime()) ? 'Não informada' : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date) }
function formatarMoeda(valor: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor) }
