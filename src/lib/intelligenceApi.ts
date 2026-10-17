import { z } from 'zod'
import { apiRequest } from './api'

export interface QuestionnaireData {
  despesaOperacionalMensal: number
  caixaDisponivel: number
  margemBrutaPercentual?: number | null
  cacEstimado?: number | null
  churnMensalPercentual?: number | null
  evolucaoFaturamento: 'crescimento_consistente' | 'estavel' | 'oscilando' | 'em_queda' | 'nao_informado'
  prioridadePrincipal: 'acelerar_crescimento' | 'reduzir_custos' | 'captar_investimentos' | 'aquisicao_clientes' | 'retencao_clientes' | 'aumentar_rentabilidade'
  nichoEspecifico: string
  publicoAlvoRegiao: string
  diferencialCompetitivo?: string | null
}

export const questionnaireSchema = z.object({
  despesaOperacionalMensal: z.number().min(0, 'Informe a despesa operacional mensal média (valor maior ou igual a zero).'),
  caixaDisponivel: z.number().min(0, 'Informe o saldo disponível em caixa (valor maior ou igual a zero).'),
  margemBrutaPercentual: z.number().min(0).max(100).optional().nullable(),
  cacEstimado: z.number().min(0).optional().nullable(),
  churnMensalPercentual: z.number().min(0).max(100).optional().nullable(),
  evolucaoFaturamento: z.enum(['crescimento_consistente', 'estavel', 'oscilando', 'em_queda', 'nao_informado'], {
    message: 'Selecione a evolução do faturamento nos últimos 3 meses.',
  }),
  prioridadePrincipal: z.enum([
    'acelerar_crescimento',
    'reduzir_custos',
    'captar_investimentos',
    'aquisicao_clientes',
    'retencao_clientes',
    'aumentar_rentabilidade',
  ], {
    message: 'Selecione a principal prioridade estratégica da startup.',
  }),
  nichoEspecifico: z.string().trim().min(3, 'O nicho específico deve ter pelo menos 3 caracteres.').max(300),
  publicoAlvoRegiao: z.string().trim().min(3, 'O público-alvo e região devem ter pelo menos 3 caracteres.').max(300),
  diferencialCompetitivo: z.string().trim().max(500).optional().nullable(),
})

export interface IntelligenceContextData {
  nomeStartup: string
  descricao: string
  segmentoPrincipal: string
  segmentosSecundarios: string[]
  cidade: string
  estado: string
  dataFundacao: string
  receitaMensal: number | null
  mrr: number | null
  clientesAtivos: number | null
  pilotosAtivos: number | null
  crescimentoMensal: number | null
  evidenciaTracao: string | null
  mesReferencia: string | null
  metaCaptacao: number | null
  valorCaptado: number | null
  ultimoQuestionario: QuestionnaireData | null
  temRelatorioPrevio: boolean
  dataUltimoRelatorio: string | null
}

export interface FinancialIndicators {
  receitaBaseMensal: number
  despesaOperacionalMensal: number
  saldoOperacionalSimplificado: number
  consumoCaixaNetBurn: number
  runwayMesesEstimado: number | null
  statusRunway: 'sustentavel' | 'confortavel' | 'alerta' | 'critico'
  margemBrutaPercentual: number | null
  lucroBrutoEstimado: number | null
  cacEstimado: number | null
  churnMensalPercentual: number | null
  ticketMedioEstimado: number | null
  formulasEPremissas: string
}

export interface DataQualityIndicator {
  status: 'suficiente' | 'parcial' | 'insuficiente'
  nivelRotulo: string
  criteriosAtendidos: string[]
  dadosFaltantesOuRecomendados: string[]
  orientacaoMelhoria: string
}

export interface GrowthScenario {
  cenario: string
  descricaoPremissas: string
  receitaProjetada3m: number
  receitaProjetada6m: number
  receitaProjetada12m: number
  saldoOperacionalProjetado3m: number
  saldoOperacionalProjetado6m: number
  saldoOperacionalProjetado12m: number
  caixaProjetado3m: number
  caixaProjetado6m: number
  caixaProjetado12m: number
}

export interface GrowthProjections {
  possuiDadosProjecao: boolean
  analiseQualitativa: string
  cenarios: GrowthScenario[]
  avisoSimulacao: string
}

export interface ExecutiveOverview {
  resumoExecutivo: string
  pontosFortes: string[]
  pontosAtencao: string[]
  limitacoesDados: string[]
}

export interface CompetitiveIntelligence {
  contextualizacaoNicho: string
  concorrentesIdentificados: string[]
  notaConcorrentesFontes: string
  potenciaisVantagensCompetitivas: string[]
  riscosMercado: string[]
  oportunidadesPosicionamento: string[]
}

export interface StrategicRecommendation {
  prioridade: string
  titulo: string
  descricao: string
  justificativaEDados: string
}

export interface IntelligenceReportData {
  id: number
  versaoBeta: boolean
  avisoBetaCurto: string
  avisoBetaCompleto: string
  modeloIa: string
  dataGeracao: string
  qualidadeDados: DataQualityIndicator
  saudeFinanceira: FinancialIndicators
  crescimentoEProjecoes: GrowthProjections
  visaoGeral: ExecutiveOverview
  inteligenciaCompetitiva: CompetitiveIntelligence
  recomendacoes: StrategicRecommendation[]
  questionarioUtilizado: QuestionnaireData | null
}

export async function carregarContextoIntelligence(): Promise<IntelligenceContextData> {
  return apiRequest<IntelligenceContextData>('/intelligence/context')
}

export async function carregarRelatorioIntelligence(): Promise<IntelligenceReportData | null> {
  try {
    return await apiRequest<IntelligenceReportData>('/intelligence/report')
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

export async function gerarAnaliseIntelligence(questionario: QuestionnaireData): Promise<IntelligenceReportData> {
  return apiRequest<IntelligenceReportData>('/intelligence/analyze', {
    method: 'POST',
    body: JSON.stringify(questionario),
  })
}
