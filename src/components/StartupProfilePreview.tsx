import { ArrowRight, Info, TrendingUp } from 'lucide-react'
import genericStartupImage from '../assets/generic_Startup.png'
import { SegmentIcon } from './SegmentIcon'

interface StartupProfilePreviewProps {
  nomeStartup: string
  segmentoNome: string
  fase: string
  descricao: string
  videoPitchUrl: string
  valorAlvo: string
  valorCaptado: string
  percentualEquityOferecido: string
  status: string
  dataFundacao: string
}

export function StartupProfilePreview({
  nomeStartup,
  segmentoNome,
  fase,
  descricao,
  valorAlvo,
  valorCaptado,
  percentualEquityOferecido,
  status,
  dataFundacao,
}: StartupProfilePreviewProps) {
  const nome = nomeStartup.trim() || 'Nome da startup'
  const segmento = segmentoNome || 'Segmento não selecionado'
  const meta = Number(valorAlvo)
  const captado = Number(valorCaptado)
  const equity = Number(percentualEquityOferecido)
  const temMeta = valorAlvo.trim() !== '' && Number.isFinite(meta) && meta > 0
  const temCaptado = valorCaptado.trim() !== '' && Number.isFinite(captado) && captado >= 0
  const progresso = temMeta && temCaptado ? Math.min(100, Math.max(0, (captado / meta) * 100)) : null
  const metaTexto = temMeta ? formatarMoeda(meta) : 'Não informado'
  const captadoTexto = temCaptado ? formatarMoeda(captado) : 'Não informado'
  const equityTexto = percentualEquityOferecido.trim() !== '' && Number.isFinite(equity) && equity > 0 ? `${equity}%` : 'Não informado'
  const statusTexto = status === 'aberta' ? 'Rodada aberta' : status === 'encerrada' ? 'Rodada encerrada' : 'Status não informado'
  const fundacaoTexto = dataFundacao ? `Fundada em ${formatarMesAno(dataFundacao)}` : 'Fundação não informada'

  return (
    <div className="startup-profile-preview">
      <div className="startup-profile-preview-card">
        <div className="startup-profile-preview-header">
          <div className="startup-profile-preview-logo">
            <img src={genericStartupImage} alt="" />
          </div>
          <div>
            <h3>{nome}</h3>
            <p>
              <span className="segment-preview-primary"><SegmentIcon nome={segmento} />{segmento}</span>
              <span className="segment-preview-phase">Fase: {fase}</span>
            </p>
          </div>
          <span className={`startup-profile-preview-status ${status === 'aberta' ? 'is-open' : ''}`}>{statusTexto}</span>
        </div>
        <div className="startup-profile-preview-metrics">
          <div><span>Meta</span><strong>{metaTexto}</strong></div>
          <div><span>Equity oferecido</span><strong>{equityTexto}</strong></div>
        </div>
        <div className="startup-profile-preview-progress">
          <div><span>Progresso da rodada</span><strong>{progresso === null ? '--' : `${Math.round(progresso)}%`}</strong></div>
          <div className="startup-profile-preview-progress-bar"><span style={{ width: `${progresso ?? 0}%` }} /></div>
          <small>{captadoTexto} captados · {fundacaoTexto}</small>
        </div>
        <div className="startup-profile-preview-match">
          <TrendingUp size={16} aria-hidden="true" />
          <span>O match será calculado para cada investidor</span>
        </div>
        <div className="startup-profile-preview-actions">
          <button className="button button-navy button-compact" type="button" disabled>
            Fazer proposta
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button className="button button-outline button-compact" type="button" disabled>
            <Info size={16} aria-hidden="true" />
            Mais detalhes
          </button>
        </div>
      </div>
      <small>Prévia do perfil exibido para investidores</small>
    </div>
  )
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
}

function formatarMesAno(valor: string) {
  const data = new Date(`${valor}-01T00:00:00`)
  return Number.isNaN(data.getTime()) ? valor : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data)
}
