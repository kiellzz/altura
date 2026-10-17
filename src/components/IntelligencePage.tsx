import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Compass,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { traduzirErroApi } from '../lib/apiErrors'
import {
  carregarContextoIntelligence,
  carregarRelatorioIntelligence,
  gerarAnaliseIntelligence,
  type IntelligenceContextData,
  type IntelligenceReportData,
  type QuestionnaireData,
} from '../lib/intelligenceApi'
import { Brand } from './Brand'
import { DashboardNavMenu } from './DashboardNavMenu'
import { ThemeToggle } from './ThemeToggle'
import { useToast } from './ToastProvider'
import { formatBRL, formatNumber, formatPercent } from '../lib/formatters'
import { allBenchmarks } from '../metrics/benchmarks'

interface Props {
  onBack: () => void
}


function optionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function IntelligencePage({ onBack }: Props) {
  const { usuario } = useAuth()
  const { showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingStep, setAnalyzingStep] = useState(0)
  const [context, setContext] = useState<IntelligenceContextData | null>(null)
  const [report, setReport] = useState<IntelligenceReportData | null>(null)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [activeScenario, setActiveScenario] = useState<'Conservador' | 'Base' | 'Otimista'>('Base')

  // Form state
  const [despesa, setDespesa] = useState<string>('')
  const [caixa, setCaixa] = useState<string>('')
  const [margemBruta, setMargemBruta] = useState<string>('')
  const [cac, setCac] = useState<string>('')
  const [churn, setChurn] = useState<string>('')
  const [evolucao, setEvolucao] = useState<QuestionnaireData['evolucaoFaturamento']>('crescimento_consistente')
  const [prioridade, setPrioridade] = useState<QuestionnaireData['prioridadePrincipal']>('acelerar_crescimento')
  const [nicho, setNicho] = useState<string>('')
  const [publico, setPublico] = useState<string>('')
  const [diferencial, setDiferencial] = useState<string>('')
  const [investimentoMarketing, setInvestimentoMarketing] = useState<string>('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [ctx, rep] = await Promise.all([
          carregarContextoIntelligence(),
          carregarRelatorioIntelligence(),
        ])
        if (!active) return
        setContext(ctx)
        setReport(rep)

        // Se houver questionário prévio, preencher o formulário
        const q = rep?.questionarioUtilizado || ctx.ultimoQuestionario
        if (q) {
          setDespesa(q.despesaOperacionalMensal.toString())
          setCaixa(q.caixaDisponivel.toString())
          setMargemBruta(q.margemBrutaPercentual?.toString() || '')
          setCac(q.cacEstimado?.toString() || '')
          setChurn(q.churnMensalPercentual?.toString() || '')
          setEvolucao(q.evolucaoFaturamento)
          setPrioridade(q.prioridadePrincipal)
          setNicho(q.nichoEspecifico)
          setPublico(q.publicoAlvoRegiao)
          setDiferencial(q.diferencialCompetitivo || '')
          setInvestimentoMarketing(q.investimentoMarketingVendasMensal?.toString() || '')
        } else {
          // Valores padrão baseados no contexto
          if (ctx.segmentoPrincipal) {
            setNicho(`Solução no segmento de ${ctx.segmentoPrincipal} voltada para...`)
          }
        }

        // Se não tiver relatório prévio, abrir direto o formulário
        if (!rep) {
          setIsWizardOpen(true)
        }
      } catch (err) {
        if (!active) return
        showError(traduzirErroApi(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [showError])

  // Timer de progresso visual simulado enquanto o Gemini processa
  useEffect(() => {
    if (!analyzing) {
      setAnalyzingStep(0)
      return
    }
    const steps = [
      'Validando dados cadastrais e financeiros...',
      'Calculando indicadores de net burn e runway...',
      'Processando inteligência de mercado com Gemini...',
      'Sintetizando recomendações e conclusões...',
    ]
    const timer = setInterval(() => {
      setAnalyzingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2800)
    return () => clearInterval(timer)
  }, [analyzing])

  if (usuario?.tipo !== 'startup') {
    return (
      <main id="conteudo" className="dashboard-shell">
        <div className="dashboard-content">
          <div className="access-denied">
            <Rocket size={46} />
            <h3>Área exclusiva para startups</h3>
            <p>O Altura Intelligence é destinado apenas aos perfis autorizados de startups cadastradas.</p>
            <button className="button button-outline" onClick={onBack}>
              Voltar ao painel
            </button>
          </div>
        </div>
      </main>
    )
  }

  const fillDemoData = () => {
    const receitaBase = context?.mrr && context.mrr > 0
      ? context.mrr
      : context?.receitaMensal && context.receitaMensal > 0
        ? context.receitaMensal
        : 75000
    const despesaDemo = Math.round(receitaBase * 0.82)
    const localizacao = [context?.cidade, context?.estado].filter(Boolean).join('/') || 'Brasil'
    const segmento = context?.segmentoPrincipal || 'tecnologia B2B'

    setDespesa(String(despesaDemo))
    setCaixa(String(despesaDemo * 9))
    setMargemBruta('72')
    setCac('1800')
    setChurn('2.3')
    setEvolucao('crescimento_consistente')
    setPrioridade('captar_investimentos')
    setNicho(`Plataforma B2B no segmento de ${segmento}, com receita recorrente e foco em ganho de eficiência operacional.`)
    setPublico(`Pequenas e médias empresas de ${localizacao}, com expansão planejada para o mercado brasileiro.`)
    setDiferencial('Tecnologia proprietária, implantação rápida e acompanhamento consultivo orientado por dados.')
    setWizardStep(4)
  }

  const handleStartAnalysis = async (e?: FormEvent) => {
    if (e) e.preventDefault()

    const numDespesa = Number(despesa)
    const numCaixa = Number(caixa)
    const numMargemBruta = optionalNumber(margemBruta)
    const numCac = optionalNumber(cac)
    const numChurn = optionalNumber(churn)

    if (isNaN(numDespesa) || numDespesa < 0) {
      showError('Informe uma despesa operacional mensal válida.')
      setWizardStep(1)
      return
    }
    if (isNaN(numCaixa) || numCaixa < 0) {
      showError('Informe um saldo de caixa disponível válido.')
      setWizardStep(1)
      return
    }
    if (numMargemBruta !== null && (numMargemBruta < 0 || numMargemBruta > 100)) {
      showError('A margem bruta deve estar entre 0% e 100%.')
      setWizardStep(1)
      return
    }
    if (numCac !== null && numCac < 0) {
      showError('O CAC estimado não pode ser negativo.')
      setWizardStep(1)
      return
    }
    if (numChurn !== null && (numChurn < 0 || numChurn > 100)) {
      showError('O churn mensal deve estar entre 0% e 100%.')
      setWizardStep(1)
      return
    }
    if (!nicho.trim() || nicho.trim().length < 3) {
      showError('Informe o nicho específico de atuação da startup.')
      setWizardStep(3)
      return
    }
    if (!publico.trim() || publico.trim().length < 3) {
      showError('Informe o público-alvo e a região de atuação.')
      setWizardStep(3)
      return
    }

    const payload: QuestionnaireData = {
      despesaOperacionalMensal: numDespesa,
      caixaDisponivel: numCaixa,
      margemBrutaPercentual: numMargemBruta,
      cacEstimado: numCac,
      churnMensalPercentual: numChurn,
      evolucaoFaturamento: evolucao,
      prioridadePrincipal: prioridade,
      nichoEspecifico: nicho.trim(),
      publicoAlvoRegiao: publico.trim(),
      diferencialCompetitivo: diferencial.trim() ? diferencial.trim() : null,
      investimentoMarketingVendasMensal: optionalNumber(investimentoMarketing),
    }

    setAnalyzing(true)
    try {
      const generated = await gerarAnaliseIntelligence(payload)
      setReport(generated)
      setIsWizardOpen(false)
    } catch (err) {
      showError(traduzirErroApi(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const qualityVerified = report?.qualidadeDados.criteriosAtendidos.length ?? 0
  const qualityMissing = report?.qualidadeDados.dadosFaltantesOuRecomendados.length ?? 0
  const qualityTotal = Math.max(qualityVerified + qualityMissing, 1)
  const qualityPercent = Math.round((qualityVerified / qualityTotal) * 100)

  return (
    <main id="conteudo" className="dashboard-shell intelligence-shell">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-brand">
            <DashboardNavMenu />
            <Brand />
            <div className="dashboard-user-info">
              <p className="kicker">Análise Estratégica Assistida por IA</p>
              <div className="intelligence-brand-title">
                <h1>Altura Intelligence</h1>
                <span className="beta-badge" title="Funcionalidade em fase de testes preliminares">BETA</span>
              </div>
            </div>
          </div>
          <div className="dashboard-actions">
            <ThemeToggle />
            <button className="button button-ghost button-compact" type="button" onClick={onBack}>
              <ArrowLeft size={17} />
              <span>Painel</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content intelligence-content">
        {/* Banner de Aviso Obrigatório BETA */}
        <section className="intelligence-beta-disclaimer">
          <div className="intelligence-disclaimer-icon">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <div className="intelligence-disclaimer-text">
            <strong>Altura Intelligence — Versão BETA</strong>
            <p>
              Esta ferramenta utiliza inteligência artificial para fornecer análises preliminares sobre o desempenho
              financeiro, crescimento e posicionamento de mercado da sua startup. Os resultados podem conter imprecisões e
              não possuem o mesmo nível de profundidade de uma auditoria financeira ou consultoria profissional. Decisões
              relevantes devem ser avaliadas com profissionais qualificados.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="activity-placeholder">
            <LoaderCircle className="feed-spin" size={32} />
            <p>Carregando dados da sua startup...</p>
          </div>
        ) : analyzing ? (
          /* Estado de Processamento com Gemini */
          <div className="intelligence-analyzing-card">
            <div className="intelligence-analyzing-glow">
              <Sparkles size={40} className="intelligence-analyzing-icon" />
            </div>
            <h2>Processando diagnóstico estratégico</h2>
            <p className="intelligence-analyzing-step">
              {[
                'Validando dados cadastrais e financeiros...',
                'Calculando indicadores determinísticos (Net Burn e Runway)...',
                'Processando inteligência de mercado com Gemini...',
                'Sintetizando relatório e recomendações executivas...',
              ][analyzingStep]}
            </p>
            <div className="intelligence-progress-bar-wrap">
              <div
                className="intelligence-progress-bar-fill"
                style={{ width: `${((analyzingStep + 1) / 4) * 100}%` }}
              />
            </div>
            <small>Este processo leva geralmente entre 10 e 40 segundos no servidor.</small>
          </div>
        ) : isWizardOpen ? (
          /* Questionário Complementar em Etapas */
          <section className="intelligence-wizard-card">
            <div className="intelligence-wizard-header">
              <div>
                <span className="kicker">Questionário Complementar (~2 minutos)</span>
                <h2>Dados estratégicos para análise</h2>
                <p>
                  Suas métricas de cadastro já foram importadas automaticamente. Preencha apenas as informações operacionais
                  complementares abaixo.
                </p>
              </div>
              <div className="intelligence-wizard-header-actions">
                <button
                  type="button"
                  className="button button-outline button-compact"
                  onClick={fillDemoData}
                  title="Preenche valores ilustrativos e avança para a revisão"
                >
                  <Zap size={16} />
                  Preencher demonstração
                </button>
                {report && (
                  <button
                    type="button"
                    className="button button-ghost button-compact"
                    onClick={() => setIsWizardOpen(false)}
                  >
                    Voltar ao relatório
                  </button>
                )}
              </div>
            </div>

            {/* Stepper */}
            <div className="intelligence-stepper">
              <div className={`intelligence-step ${wizardStep >= 1 ? 'is-active' : ''}`}>
                <span className="intelligence-step-number">1</span>
                <span className="intelligence-step-label">Finanças</span>
              </div>
              <div className={`intelligence-step-divider ${wizardStep >= 2 ? 'is-active' : ''}`} />
              <div className={`intelligence-step ${wizardStep >= 2 ? 'is-active' : ''}`}>
                <span className="intelligence-step-number">2</span>
                <span className="intelligence-step-label">Tração & Foco</span>
              </div>
              <div className={`intelligence-step-divider ${wizardStep >= 3 ? 'is-active' : ''}`} />
              <div className={`intelligence-step ${wizardStep >= 3 ? 'is-active' : ''}`}>
                <span className="intelligence-step-number">3</span>
                <span className="intelligence-step-label">Nicho & Mercado</span>
              </div>
              <div className={`intelligence-step-divider ${wizardStep >= 4 ? 'is-active' : ''}`} />
              <div className={`intelligence-step ${wizardStep >= 4 ? 'is-active' : ''}`}>
                <span className="intelligence-step-number">4</span>
                <span className="intelligence-step-label">Revisão</span>
              </div>
            </div>

            {/* Etapa 1: Finanças Operacionais */}
            {wizardStep === 1 && (
              <div className="intelligence-step-body">
                <h3>Etapa 1: Finanças Operacionais da Startup</h3>
                <p className="intelligence-step-desc">
                  Esses dados permitem estimar o saldo operacional simplificado, o consumo líquido de caixa (Net Burn) e o
                  tempo de vida útil da operação (Runway).
                </p>

                <div className="form-group">
                  <label htmlFor="despesa">
                    1. Qual é a despesa operacional mensal média da startup? (R$)
                  </label>
                  <p className="form-hint">
                    Some folha de pagamento, infraestrutura, ferramentas, marketing, impostos e custos fixos regulares.
                  </p>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">R$</span>
                    <input
                      id="despesa"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={despesa}
                      onChange={(e) => setDespesa(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="investimentoMarketing">Investimento mensal adicional em marketing e vendas (R$) (opcional)</label>
                  <p className="form-hint">Use este campo quando a prioridade for expansão nacional; ele entra na despesa projetada, não no saldo atual.</p>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">R$</span>
                    <input id="investimentoMarketing" type="number" step="any" min="0" placeholder="0,00" value={investimentoMarketing} onChange={(e) => setInvestimentoMarketing(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="caixa">
                    2. Quanto a startup possui atualmente disponível em caixa? (R$)
                  </label>
                  <p className="form-hint">
                    Saldo disponível e desimpedido nas contas bancárias da empresa. Não considere dinheiro prometido, aportes
                    futuros ou patrimônio pessoal dos sócios.
                  </p>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">R$</span>
                    <input
                      id="caixa"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={caixa}
                      onChange={(e) => setCaixa(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="intelligence-unit-metrics-intro">
                  <strong>Unit economics essenciais (opcional, mas recomendado)</strong>
                  <p>Três números ajudam investidores a avaliar qualidade da receita, eficiência comercial e retenção.</p>
                </div>
                <div className="intelligence-unit-metrics-grid">
                  <div className="form-group">
                    <label htmlFor="margemBruta">Margem bruta (%)</label>
                    <p className="form-hint">Receita menos custos diretamente ligados à entrega, dividida pela receita.</p>
                    <input id="margemBruta" type="number" min="0" max="100" step="0.1" placeholder="Ex: 70" value={margemBruta} onChange={(e) => setMargemBruta(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cac">CAC estimado (R$)</label>
                    <p className="form-hint">Gasto de vendas e marketing por novo cliente conquistado.</p>
                    <input id="cac" type="number" min="0" step="any" placeholder="Ex: 1200" value={cac} onChange={(e) => setCac(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="churn">Churn mensal (%)</label>
                    <p className="form-hint">Percentual de clientes que cancelam em um mês. Deixe vazio se não se aplicar.</p>
                    <input id="churn" type="number" min="0" max="100" step="0.1" placeholder="Ex: 2.5" value={churn} onChange={(e) => setChurn(e.target.value)} />
                  </div>
                </div>

                <div className="intelligence-wizard-actions">
                  <span />
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      if (!despesa || Number(despesa) < 0) {
                        showError('Informe uma despesa operacional mensal válida.')
                        return
                      }
                      if (!caixa || Number(caixa) < 0) {
                        showError('Informe o saldo de caixa disponível válido.')
                        return
                      }
                      setWizardStep(2)
                    }}
                  >
                    <span>Próximo passo</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 2: Tração & Prioridade */}
            {wizardStep === 2 && (
              <div className="intelligence-step-body">
                <h3>Etapa 2: Dinâmica de Faturamento e Prioridade</h3>
                <p className="intelligence-step-desc">
                  Entender o comportamento recente e o objetivo central orienta a calibragem das recomendações estratégicas.
                </p>

                <div className="form-group">
                  <label>3. Como o faturamento evoluiu nos últimos três meses?</label>
                  <div className="intelligence-radio-grid">
                    {[
                      { id: 'crescimento_consistente', label: 'Crescimento consistente', desc: 'Subindo mês a mês' },
                      { id: 'estavel', label: 'Relativamente estável', desc: 'Variações normais sem grande alta ou queda' },
                      { id: 'oscilando', label: 'Oscilando', desc: 'Altas e baixas sazonais ou imprevisíveis' },
                      { id: 'em_queda', label: 'Em queda', desc: 'Tendência recente de redução de receitas' },
                      { id: 'nao_informado', label: 'Não sei informar / Pré-receita', desc: 'Sem histórico suficiente' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`intelligence-choice-card ${evolucao === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setEvolucao(opt.id as QuestionnaireData['evolucaoFaturamento'])}
                      >
                        <strong>{opt.label}</strong>
                        <small>{opt.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>4. Qual é a principal prioridade da startup no momento?</label>
                  <div className="intelligence-radio-grid">
                    {[
                      { id: 'acelerar_crescimento', label: 'Acelerar crescimento', desc: 'Expandir base e volume de vendas' },
                      { id: 'reduzir_custos', label: 'Reduzir custos', desc: 'Estender runway e otimizar eficiência' },
                      { id: 'captar_investimentos', label: 'Captar investimentos', desc: 'Preparar rodada e métricas para fundos' },
                      { id: 'aquisicao_clientes', label: 'Aumentar aquisição de clientes', desc: 'Novos canais e tração comercial' },
                      { id: 'retencao_clientes', label: 'Melhorar retenção de clientes', desc: 'Reduzir churn e aumentar LTV' },
                      { id: 'aumentar_rentabilidade', label: 'Aumentar a rentabilidade', desc: 'Buscar ponto de equilíbrio e margens' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`intelligence-choice-card ${prioridade === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setPrioridade(opt.id as QuestionnaireData['prioridadePrincipal'])}
                      >
                        <strong>{opt.label}</strong>
                        <small>{opt.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="intelligence-wizard-actions">
                  <button type="button" className="button button-outline" onClick={() => setWizardStep(1)}>
                    <ArrowLeft size={17} />
                    <span>Voltar</span>
                  </button>
                  <button type="button" className="button button-primary" onClick={() => setWizardStep(3)}>
                    <span>Próximo passo</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 3: Nicho & Concorrência */}
            {wizardStep === 3 && (
              <div className="intelligence-step-body">
                <h3>Etapa 3: Nicho Específico e Diferenciação</h3>
                <p className="intelligence-step-desc">
                  Contextualize o posicionamento da startup para análise de mercado sem dados genéricos.
                </p>

                <div className="form-group">
                  <label htmlFor="nicho">
                    5. Qual é o nicho específico da startup?
                  </label>
                  <p className="form-hint">
                    Segmento cadastrado: <strong>{context?.segmentoPrincipal || 'Geral'}</strong>.
                    Exemplo: "Plataforma SaaS de gestão financeira integrada para pequenas empresas do varejo."
                  </p>
                  <textarea
                    id="nicho"
                    rows={2}
                    value={nicho}
                    onChange={(e) => setNicho(e.target.value)}
                    placeholder="Descreva o nicho de mercado específico com profundidade..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="publico">
                    6. Qual é o público-alvo e a região de atuação?
                  </label>
                  <p className="form-hint">
                    Exemplo: "Pequenas e médias empresas brasileiras, principalmente no Sudeste e Sul."
                  </p>
                  <input
                    id="publico"
                    type="text"
                    value={publico}
                    onChange={(e) => setPublico(e.target.value)}
                    placeholder="Ex: Médias indústrias no Brasil..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="diferencial">
                    7. Qual é o principal diferencial competitivo da startup? (Opcional)
                  </label>
                  <p className="form-hint">
                    Patentes, tecnologia proprietária, rede de contatos, custo marginal menor, atendimento consultivo, etc.
                  </p>
                  <textarea
                    id="diferencial"
                    rows={2}
                    maxLength={500}
                    value={diferencial}
                    onChange={(e) => setDiferencial(e.target.value)}
                    placeholder="Ex: Integração nativa com ERPs legados sem necessidade de desenvolvedor..."
                  />
                  <small className="char-count">{diferencial.length}/500 caracteres</small>
                </div>

                <div className="intelligence-wizard-actions">
                  <button type="button" className="button button-outline" onClick={() => setWizardStep(2)}>
                    <ArrowLeft size={17} />
                    <span>Voltar</span>
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      if (!nicho.trim() || nicho.trim().length < 3) {
                        showError('Informe o nicho específico de atuação.')
                        return
                      }
                      if (!publico.trim() || publico.trim().length < 3) {
                        showError('Informe o público-alvo e a região.')
                        return
                      }
                      setWizardStep(4)
                    }}
                  >
                    <span>Revisar dados</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 4: Revisão Integrada */}
            {wizardStep === 4 && (
              <div className="intelligence-step-body">
                <h3>Etapa 4: Revisão dos Dados Integrados</h3>
                <p className="intelligence-step-desc">
                  Confira as informações cadastrais já existentes e as respostas complementares que serão enviadas para o
                  diagnóstico:
                </p>

                <div className="intelligence-review-grid">
                  <div className="intelligence-review-card">
                    <h4>
                      <Layers size={18} />
                      <span>Dados do Cadastro Altura</span>
                    </h4>
                    <ul>
                      <li>
                        <span>Startup:</span> <strong>{context?.nomeStartup || 'Não informado'}</strong>
                      </li>
                      <li>
                        <span>Segmento:</span> <strong>{context?.segmentoPrincipal || 'Geral'}</strong>
                      </li>
                      <li>
                        <span>Receita Mensal:</span>{' '}
                        <strong>{formatBRL(context?.receitaMensal)}</strong>
                      </li>
                      <li>
                        <span>MRR Atual:</span> <strong>{formatBRL(context?.mrr)}</strong>
                      </li>
                      <li>
                        <span>Clientes Ativos:</span> <strong>{context?.clientesAtivos ?? 'Não informado'}</strong>
                      </li>
                      <li>
                        <span>Pilotos Ativos:</span> <strong>{context?.pilotosAtivos ?? 'Não informado'}</strong>
                      </li>
                      <li>
                        <span>Crescimento Mensal:</span>{' '}
                        <strong>{formatPercent(context?.crescimentoMensal)}</strong>
                      </li>
                      <li>
                        <span>Meta de Captação:</span> <strong>{formatBRL(context?.metaCaptacao)}</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="intelligence-review-card">
                    <h4>
                      <CircleDollarSign size={18} />
                      <span>Respostas Complementares</span>
                    </h4>
                    <ul>
                      <li>
                        <span>Despesa Operacional:</span> <strong>{formatBRL(Number(despesa))}</strong>
                      </li>
                      <li>
                        <span>Caixa Disponível:</span> <strong>{formatBRL(Number(caixa))}</strong>
                      </li>
                      <li><span>Margem Bruta:</span> <strong>{margemBruta ? formatPercent(Number(margemBruta)) : 'Não informado'}</strong></li>
                      <li><span>CAC Estimado:</span> <strong>{cac ? formatBRL(Number(cac)) : 'Não informado'}</strong></li>
                      <li><span>Churn Mensal:</span> <strong>{churn ? formatPercent(Number(churn)) : 'Não informado'}</strong></li>
                      <li>
                        <span>Evolução 3 meses:</span>{' '}
                        <strong>{evolucao.replace('_', ' ').toUpperCase()}</strong>
                      </li>
                      <li>
                        <span>Prioridade:</span>{' '}
                        <strong>{prioridade.replace(/_/g, ' ').toUpperCase()}</strong>
                      </li>
                      <li>
                        <span>Nicho:</span> <strong>{nicho}</strong>
                      </li>
                      <li>
                        <span>Público / Região:</span> <strong>{publico}</strong>
                      </li>
                      <li>
                        <span>Diferencial:</span> <strong>{diferencial || 'Não informado'}</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="intelligence-wizard-actions">
                  <button type="button" className="button button-outline" onClick={() => setWizardStep(3)}>
                    <ArrowLeft size={17} />
                    <span>Voltar e ajustar</span>
                  </button>
                  <button
                    type="button"
                    className="button button-primary button-lg"
                    onClick={() => void handleStartAnalysis()}
                  >
                    <Sparkles size={19} />
                    <span>Gerar Diagnóstico com IA (BETA)</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : report ? (
          /* Visualização do Relatório Executivo */
          <div className="intelligence-report-view">
            {/* Topo do Relatório: Qualidade de Dados e Ações */}
            <div className="intelligence-report-topbar">
              <div className="intelligence-quality-badge-wrap">
                <div
                  className={`intelligence-quality-pill is-${report.qualidadeDados.status}`}
                  title={report.qualidadeDados.orientacaoMelhoria}
                >
                  <CheckCircle2 size={16} />
                  <span>{report.qualidadeDados.nivelRotulo}</span>
                </div>
                <small className="intelligence-report-date">
                  Gerado em: {new Date(report.dataGeracao).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(report.dataGeracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>

              <div className="intelligence-topbar-actions">
                <button
                  type="button"
                  className="button button-ghost button-compact"
                  onClick={() => setIsWizardOpen(true)}
                >
                  <RefreshCw size={16} />
                  <span>Atualizar dados e gerar novo diagnóstico</span>
                </button>
              </div>
            </div>

            {/* Aviso Curto de IA */}
            <div className="intelligence-alert-short">
              <Info size={16} />
              <span>{report.avisoBetaCurto}</span>
            </div>

            <details className="intelligence-section-card intelligence-collapsible intelligence-quality-panel">
              <summary className="intelligence-quality-summary">
                <div className="intelligence-summary-title">
                  <span className="intelligence-summary-icon"><CheckCircle2 size={19} /></span>
                  <div>
                    <strong>Confiabilidade dos dados</strong>
                    <small>Entenda a base usada neste diagnóstico.</small>
                  </div>
                </div>
                <div className="intelligence-summary-meta">
                  <span>{qualityVerified} de {qualityTotal} critérios verificados</span>
                  <ChevronDown className="intelligence-summary-chevron" size={18} />
                </div>
              </summary>

              <div className="intelligence-quality-overview">
                <div
                  className={`intelligence-quality-score is-${report.qualidadeDados.status}`}
                  style={{ '--quality-score': `${qualityPercent * 3.6}deg` } as CSSProperties}
                  aria-label={`${qualityPercent}% dos critérios verificados`}
                >
                  <div><strong>{qualityPercent}%</strong><small>completo</small></div>
                </div>
                <div className="intelligence-quality-copy">
                  <span>Qualidade da base</span>
                  <h3>{report.qualidadeDados.nivelRotulo}</h3>
                  <p>{report.qualidadeDados.orientacaoMelhoria}</p>
                </div>
              </div>

              <div className={`intelligence-quality-grid${qualityMissing === 0 ? ' is-single' : ''}`}>
                <section className="intelligence-quality-col">
                  <header>
                    <div><CheckCircle2 size={17} /><strong>Dados verificados</strong></div>
                    <span>{qualityVerified}</span>
                  </header>
                  <ul className="intelligence-quality-items">
                    {report.qualidadeDados.criteriosAtendidos.map((c, i) => (
                      <li key={i}><CheckCircle2 size={16} /><span>{c}</span></li>
                    ))}
                  </ul>
                </section>
                {report.qualidadeDados.dadosFaltantesOuRecomendados.length > 0 && (
                  <section className="intelligence-quality-col is-missing">
                    <header>
                      <div><HelpCircle size={17} /><strong>Para melhorar a precisão</strong></div>
                      <span>{qualityMissing}</span>
                    </header>
                    <ul className="intelligence-quality-items">
                    {report.qualidadeDados.dadosFaltantesOuRecomendados.map((d, i) => (
                        <li key={i}><HelpCircle size={16} /><span>{d}</span></li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </details>

            {/* SEÇÃO A: Visão Geral */}
            <section className="intelligence-section-card">
              <div className="intelligence-card-heading">
                <FileText size={22} className="text-primary" />
                <div>
                  <h2>Resumo executivo</h2>
                  <p>O que mais importa sobre o momento atual da startup.</p>
                </div>
              </div>

              <div className="intelligence-overview-lead">
                <p>{report.visaoGeral.resumoExecutivo}</p>
              </div>

              <div className="intelligence-columns-grid">
                <div className="intelligence-highlight-card is-positive">
                  <h4>
                    <CheckCircle2 size={18} />
                    <span>Principais Pontos Fortes</span>
                  </h4>
                  <ul>
                    {report.visaoGeral.pontosFortes.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="intelligence-highlight-card is-warning">
                  <h4>
                    <AlertTriangle size={18} />
                    <span>Principais Pontos de Atenção</span>
                  </h4>
                  <ul>
                    {report.visaoGeral.pontosAtencao.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {report.visaoGeral.limitacoesDados.length > 0 && (
                <details className="intelligence-inline-details">
                  <summary><Info size={16} /> Limitações desta análise</summary>
                  <ul>{report.visaoGeral.limitacoesDados.map((l, i) => <li key={i}>{l}</li>)}</ul>
                </details>
              )}
            </section>

            {/* SEÇÃO B: Saúde Financeira */}
            <section className="intelligence-section-card">
              <div className="intelligence-card-heading">
                <CircleDollarSign size={22} className="text-primary" />
                <div>
                  <h2>Saúde financeira</h2>
                  <p>Os quatro números essenciais para entender receita, caixa e eficiência.</p>
                </div>
              </div>

              <div className="intelligence-metrics-grid">
                <div className="intelligence-metric-box">
                  <span className="metric-label">Receita Base Mensal</span>
                  <strong className="metric-value">
                    {formatBRL(report.saudeFinanceira.receitaBaseMensal)}
                  </strong>
                  <small>MRR quando informado; caso contrário, receita mensal</small>
                </div>

                <div
                  className={`intelligence-metric-box ${
                    report.saudeFinanceira.saldoOperacionalSimplificado >= 0 ? 'is-positive' : 'is-negative'
                  }`}
                >
                  <span className="metric-label">Saldo Operacional Simplificado</span>
                  <strong className="metric-value">
                    {formatBRL(report.saudeFinanceira.saldoOperacionalSimplificado)}
                  </strong>
                  <small>
                    {report.saudeFinanceira.saldoOperacionalSimplificado >= 0
                      ? 'Receita superior à despesa mensal informada'
                      : 'Receita inferior à despesa mensal informada'}
                  </small>
                </div>

                <div className="intelligence-metric-box">
                  <span className="metric-label">Margem Bruta</span>
                  <strong className="metric-value">{formatPercent(report.saudeFinanceira.margemBrutaPercentual)}</strong>
                  <small>Quanto sobra após o custo direto de entregar o produto</small>
                </div>

                <div className={`intelligence-metric-box is-${report.saudeFinanceira.statusRunway}`}>
                  <span className="metric-label">Runway Estimado</span>
                  <strong className="metric-value">
                    {report.saudeFinanceira.runwayMesesEstimado !== null
                      ? `${formatNumber(report.saudeFinanceira.runwayMesesEstimado)} meses`
                      : 'Sustentável'}
                  </strong>
                  <small>
                    {report.saudeFinanceira.statusRunway === 'sustentavel'
                      ? 'Operação sem queima de caixa líquida'
                      : report.saudeFinanceira.statusRunway === 'confortavel'
                      ? 'Runway confortável (> 18 meses)'
                      : report.saudeFinanceira.statusRunway === 'alerta'
                      ? 'Atenção (entre 6 e 18 meses)'
                      : 'Alerta crítico (< 6 meses de caixa)'}
                  </small>
                </div>
              </div>

              <details className="intelligence-inline-details intelligence-financial-details">
                <summary><Info size={16} /> Ver outras métricas e entender os termos</summary>
                <div className="intelligence-unit-metrics-report">
                  <div className="intelligence-metric-box"><span className="metric-label">Despesa mensal</span><strong className="metric-value">{formatBRL(report.saudeFinanceira.despesaOperacionalMensal)}</strong><small>Total mensal informado pela startup</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">Net Burn</span><strong className="metric-value">{formatBRL(report.saudeFinanceira.consumoCaixaNetBurn)}/mês</strong><small>Quanto do caixa é consumido por mês</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">CAC</span><strong className="metric-value">{formatBRL(report.saudeFinanceira.cacEstimado)}</strong><small>Custo médio para conquistar um cliente</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">Churn mensal</span><strong className="metric-value">{formatPercent(report.saudeFinanceira.churnMensalPercentual)}</strong><small>Parcela de clientes perdida a cada mês</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">Ticket médio</span><strong className="metric-value">{formatBRL(report.saudeFinanceira.ticketMedioEstimado)}</strong><small>Receita média mensal por cliente</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">Retenção anual estimada</span><strong className="metric-value">{formatPercent(report.saudeFinanceira.retencaoAnualEstimadaPercentual)}</strong><small>Conversão de (1 − churn mensal)^12</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">Payback estimado</span><strong className="metric-value">{report.saudeFinanceira.paybackMesesEstimado != null ? `${formatNumber(report.saudeFinanceira.paybackMesesEstimado)} meses` : 'Não calculável'}</strong><small>CAC / (ticket médio × margem bruta)</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">LTV estimado</span><strong className="metric-value">{formatBRL(report.saudeFinanceira.ltvEstimado)}</strong><small>(ticket médio × margem bruta) / churn mensal</small></div>
                  <div className="intelligence-metric-box"><span className="metric-label">LTV/CAC estimado</span><strong className="metric-value">{report.saudeFinanceira.ltvCacEstimado != null ? `${formatNumber(report.saudeFinanceira.ltvCacEstimado, 2)}x` : 'Não calculável'}</strong><small>Relação entre valor estimado e aquisição</small></div>
                </div>
                <div className="intelligence-plain-glossary">
                  <p><strong>Runway:</strong> por quantos meses o caixa sustenta a operação no ritmo atual.</p>
                  <p><strong>Margem bruta:</strong> percentual da receita que sobra após os custos diretos da entrega.</p>
                  <p><strong>Saldo simplificado:</strong> receita menos despesa informada; não é lucro contábil.</p>
                  <p>{report.saudeFinanceira.formulasEPremissas}</p>
                  {report.saudeFinanceira.alertaRetencao && <p className="intelligence-inline-alert"><strong>Retenção:</strong> {report.saudeFinanceira.alertaRetencao}</p>}
                  {report.saudeFinanceira.renovacaoInformadaPercentual != null && <p><strong>Renovação informada:</strong> {formatPercent(report.saudeFinanceira.renovacaoInformadaPercentual)} (contratos; comparar com retenção de clientes com cautela).</p>}
                  {report.saudeFinanceira.alertaSanidadeUnitEconomics && <p className="intelligence-inline-alert"><strong>Sanity check:</strong> {report.saudeFinanceira.alertaSanidadeUnitEconomics}</p>}
                  <div className="intelligence-methodology-list">
                    <h4>Como é calculado e referência</h4>
                    <p><strong>Saldo operacional:</strong> receita base − despesa mensal.</p>
                    <p><strong>Net burn:</strong> máximo entre zero e o negativo do saldo operacional.</p>
                    <p><strong>Runway:</strong> caixa disponível ÷ net burn; infinito quando net burn ≤ 0.</p>
                    <p><strong>Ticket médio:</strong> receita base ÷ clientes ativos.</p>
                    <p><strong>Retenção anual:</strong> (1 − churn mensal)^12 = {formatPercent(report.saudeFinanceira.retencaoAnualEstimadaPercentual)}.</p>
                    <p><strong>Payback:</strong> CAC ÷ (ticket médio × margem bruta) = {report.saudeFinanceira.paybackMesesEstimado != null ? `${formatNumber(report.saudeFinanceira.paybackMesesEstimado)} meses` : 'não calculável'}.</p>
                    <p><strong>LTV:</strong> (ticket médio × margem bruta) ÷ churn mensal = {formatBRL(report.saudeFinanceira.ltvEstimado)}.</p>
                    <p><strong>LTV/CAC:</strong> LTV ÷ CAC = {report.saudeFinanceira.ltvCacEstimado != null ? `${formatNumber(report.saudeFinanceira.ltvCacEstimado, 2)}x` : 'não calculável'}.</p>
                    {allBenchmarks().map((benchmark) => <p key={benchmark.metrica + benchmark.contexto}><strong>{benchmark.metrica}:</strong> {benchmark.min !== undefined ? `a partir de ${formatNumber(benchmark.min)}${benchmark.unidade === 'multiplo' ? 'x' : '%'}` : ''}{benchmark.max !== undefined ? ` até ${formatNumber(benchmark.max)}${benchmark.unidade === 'meses' ? ' meses' : benchmark.unidade === 'multiplo' ? 'x' : '%'}` : ''} — {benchmark.contexto}. <a href={benchmark.fonte.url} target="_blank" rel="noreferrer">{benchmark.fonte.autor}, {benchmark.fonte.titulo}</a> <span className="intelligence-source-badge">{benchmark.confianca === 'alta' ? 'Referência de mercado' : 'Regra heurística'}</span></p>)}
                  </div>
                </div>
              </details>
            </section>

            {/* SEÇÃO C: Crescimento e Projeções */}
            <section className="intelligence-section-card">
              <div className="intelligence-card-heading">
                <TrendingUp size={22} className="text-primary" />
                <div>
                  <h2>Projeção de 12 meses</h2>
                  <p>Uma simulação em três cenários. Não é promessa de resultado.</p>
                </div>
              </div>

              {report.crescimentoEProjecoes.possuiDadosProjecao ? (
                <div>
                  <div className="intelligence-scenarios-nav">
                    {(['Conservador', 'Base', 'Otimista'] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        className={`intelligence-scenario-tab ${activeScenario === sc ? 'is-active' : ''}`}
                        onClick={() => setActiveScenario(sc)}
                      >
                        {sc === 'Conservador' && <TrendingDown size={16} />}
                        {sc === 'Base' && <BarChart3 size={16} />}
                        {sc === 'Otimista' && <Zap size={16} />}
                        <span>Cenário {sc}</span>
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const currentScenario = report.crescimentoEProjecoes.cenarios.find(
                      (c) => c.cenario === activeScenario
                    )
                    if (!currentScenario) return null
                    return (
                      <div className="intelligence-scenario-display">
                        <p className="intelligence-scenario-desc">{currentScenario.descricaoPremissas}</p>
                        <div className="intelligence-scenario-premises">
                          <span>Taxa: <strong>{formatPercent(currentScenario.taxaCrescimentoMensalPercentual)} a.m.</strong></span>
                          <span>Churn: <strong>{formatPercent(currentScenario.churnMensalPercentual)}</strong></span>
                          <span>CAC: <strong>{formatBRL(currentScenario.cacEstimado)}</strong></span>
                          <span>Despesa final: <strong>{formatBRL(currentScenario.despesaFinalMensal)}</strong></span>
                        </div>
                        <div className="intelligence-projections-grid">
                          <div className="intelligence-proj-box"><span>Receita mensal em 12 meses</span><strong>{formatBRL(currentScenario.receitaProjetada12m)}</strong><small>Valor simulado, não garantido</small></div>
                          <div className="intelligence-proj-box"><span>Saldo mensal em 12 meses</span><strong>{formatBRL(currentScenario.saldoOperacionalProjetado12m)}</strong><small>Receita simulada menos despesa revisada</small></div>
                          <div className="intelligence-proj-box is-highlight"><span>Caixa ao fim de 12 meses</span><strong>{formatBRL(currentScenario.caixaProjetado12m)}</strong><small>Caixa mensal acumulado com despesas revisadas</small></div>
                          <div className="intelligence-proj-box"><span>Sanity check da receita</span><strong>{formatNumber(currentScenario.multiploReceitaAtual12m, 2)}x</strong><small>Receita final / receita atual</small></div>
                          <div className="intelligence-proj-box"><span>Despesa final mensal</span><strong>{formatBRL(currentScenario.despesaFinalMensal)}</strong><small>Base + aquisição/churn + variável + marketing</small></div>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="intelligence-projection-disclaimer">
                    <AlertTriangle size={15} />
                    <span>{report.crescimentoEProjecoes.avisoSimulacao}</span>
                  </div>
                </div>
              ) : (
                <div className="intelligence-qualitative-box">
                  <Info size={20} className="text-warning" />
                  <div>
                    <h4>Análise Qualitativa de Crescimento</h4>
                    <p>{report.crescimentoEProjecoes.analiseQualitativa}</p>
                  </div>
                </div>
              )}
            </section>

            <details className="intelligence-section-card intelligence-collapsible">
              <summary>
                <span><Compass size={19} /> Contexto competitivo</span>
                <small>Abra para ver vantagens, riscos e alternativas do mercado.</small>
              </summary>

              <div className="intelligence-overview-lead">
                <p>{report.inteligenciaCompetitiva.contextualizacaoNicho}</p>
              </div>

              <div className="intelligence-columns-grid">
                <div className="intelligence-highlight-card is-positive">
                  <h4>
                    <Rocket size={18} />
                    <span>Potenciais Vantagens Competitivas</span>
                  </h4>
                  <ul>
                    {report.inteligenciaCompetitiva.potenciaisVantagensCompetitivas.slice(0, 2).map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>

                <div className="intelligence-highlight-card is-warning">
                  <h4>
                    <ShieldAlert size={18} />
                    <span>Riscos de Mercado & Barreiras</span>
                  </h4>
                  <ul>
                    {report.inteligenciaCompetitiva.riscosMercado.slice(0, 2).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="intelligence-highlight-card is-info">
                <h4>
                  <Lightbulb size={18} />
                  <span>Oportunidades de Posicionamento e Diferenciação</span>
                </h4>
                <ul>
                  {report.inteligenciaCompetitiva.oportunidadesPosicionamento.slice(0, 2).map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>

              {report.inteligenciaCompetitiva.concorrentesIdentificados.length > 0 && (
                <div className="intelligence-competitors-box">
                  <strong>Categorias e Concorrentes Relevantes:</strong>
                  <div className="intelligence-tags-wrap">
                    {report.inteligenciaCompetitiva.concorrentesIdentificados.slice(0, 3).map((c, i) => (
                      <span key={i} className="intelligence-tag">
                        {c}
                      </span>
                    ))}
                  </div>
                  <small className="intelligence-source-note">
                    {report.inteligenciaCompetitiva.notaConcorrentesFontes}
                  </small>
                </div>
              )}
            </details>

            {/* SEÇÃO E: Recomendações Estratégicas */}
            <section className="intelligence-section-card">
              <div className="intelligence-card-heading">
                <Lightbulb size={22} className="text-primary" />
                <div>
                  <h2>Próximos passos</h2>
                  <p>Três ações em ordem de prioridade.</p>
                </div>
              </div>

              <div className="intelligence-recs-grid">
                {report.recomendacoes.slice(0, 3).map((rec, i) => {
                  const isAlta = rec.prioridade.toLowerCase().includes('alta')
                  const isMedia = rec.prioridade.toLowerCase().includes('média')
                  return (
                    <div
                      key={i}
                      className={`intelligence-rec-card ${
                        isAlta ? 'is-alta' : isMedia ? 'is-media' : 'is-futura'
                      }`}
                    >
                      <div className="rec-badge-row">
                        <span className="rec-priority-badge">{rec.prioridade}</span>
                      </div>
                      <h3>{rec.titulo}</h3>
                      <p className="rec-desc">{rec.descricao}</p>
                      <div className="rec-justification">
                        <strong>
                          <Info size={14} /> Dados que sustentam esta recomendação:
                        </strong>
                        <p>{rec.justificativaEDados}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="intelligence-section-card intelligence-methodology-footer">
              <div className="intelligence-card-heading">
                <Info size={22} className="text-primary" />
                <div><h2>Metodologia e fontes</h2><p>Definições e limites usados pelo diagnóstico.</p></div>
              </div>
              <p>Faixas de referência são orientativas, variam por segmento e estágio, e não substituem análise de um profissional de finanças.</p>
              <ul>{allBenchmarks().map((benchmark) => <li key={benchmark.metrica + benchmark.fonte.url}><a href={benchmark.fonte.url} target="_blank" rel="noreferrer">{benchmark.fonte.autor} — {benchmark.fonte.titulo}</a> ({benchmark.confianca === 'alta' ? 'referência confirmada' : 'regra heurística; validar com a fonte'})</li>)}</ul>
            </section>

            {/* Rodapé do Relatório */}
            <div className="intelligence-footer-cta">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setIsWizardOpen(true)}
              >
                <RefreshCw size={17} />
                <span>Atualizar respostas e gerar novo diagnóstico</span>
              </button>
              <button type="button" className="button button-primary" onClick={onBack}>
                <ArrowLeft size={17} />
                <span>Voltar ao painel</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
