export interface StartupFinancialInput {
  mrr?: number | null
  receitaMensal?: number | null
  despesaMensal?: number | null
  caixaDisponivel?: number | null
  margemBrutaPercentual?: number | null
  clientesAtivos?: number | null
  cac?: number | null
  churnMensalPercentual?: number | null
}

export interface MetricValue {
  valor: number | null
  motivo?: string
}

export interface Metrics {
  receitaBaseMensal: MetricValue
  despesaMensal: MetricValue
  saldoOperacionalSimplificado: MetricValue
  netBurn: MetricValue
  runwayMeses: MetricValue
  margemBrutaPercentual: MetricValue
  ticketMedio: MetricValue
  cac: MetricValue
  churnMensalPercentual: MetricValue
  retencaoAnualPercentual: MetricValue
  paybackMeses: MetricValue
  ltv: MetricValue
  ltvCac: MetricValue
}

const missing = (motivo: string): MetricValue => ({ valor: null, motivo })
const value = (valor: number): MetricValue => Number.isFinite(valor) ? { valor } : missing('Resultado não finito.')
const positive = (n: number | null | undefined): n is number => n !== null && n !== undefined && Number.isFinite(n)

export function calculateMetrics(input: StartupFinancialInput): Metrics {
  const receita = positive(input.mrr) && input.mrr > 0 ? input.mrr : positive(input.receitaMensal) && input.receitaMensal > 0 ? input.receitaMensal : null
  const expense = positive(input.despesaMensal) ? input.despesaMensal : null
  const cash = positive(input.caixaDisponivel) ? input.caixaDisponivel : null
  const margin = positive(input.margemBrutaPercentual) ? input.margemBrutaPercentual : null
  const churn = positive(input.churnMensalPercentual) ? input.churnMensalPercentual : null
  const ticket = receita !== null && positive(input.clientesAtivos) && input.clientesAtivos > 0 ? receita / input.clientesAtivos : null
  const saldo = receita !== null && expense !== null ? receita - expense : null
  const netBurn = saldo !== null ? Math.max(0, -saldo) : null
  const runway = netBurn !== null && cash !== null && netBurn > 0 ? cash / netBurn : netBurn !== null && netBurn <= 0 ? null : null
  const runwayReason = netBurn !== null && netBurn <= 0 ? 'Runway infinito: net burn menor ou igual a zero.' : runway === null ? 'Caixa ou net burn não informado.' : undefined
  const retention = churn !== null ? Math.pow(1 - churn / 100, 12) * 100 : null
  const grossProfitPerCustomer = ticket !== null && margin !== null ? ticket * margin / 100 : null
  const payback = grossProfitPerCustomer !== null && positive(input.cac) && grossProfitPerCustomer > 0 ? input.cac / grossProfitPerCustomer : null
  const ltv = grossProfitPerCustomer !== null && churn !== null && churn > 0 ? grossProfitPerCustomer / (churn / 100) : null
  const ltvCac = ltv !== null && positive(input.cac) && input.cac > 0 ? ltv / input.cac : null

  return {
    receitaBaseMensal: receita === null ? missing('MRR/receita mensal ausente ou não positiva.') : value(receita),
    despesaMensal: expense === null ? missing('Despesa mensal ausente.') : value(expense),
    saldoOperacionalSimplificado: saldo === null ? missing('Receita base ou despesa ausente.') : value(saldo),
    netBurn: netBurn === null ? missing('Saldo operacional não calculável.') : value(netBurn),
    runwayMeses: runway === null ? missing(runwayReason ?? 'Runway não calculável.') : value(runway),
    margemBrutaPercentual: margin === null ? missing('Margem bruta ausente.') : value(margin),
    ticketMedio: ticket === null ? missing('Ticket exige receita base e clientes ativos maiores que zero.') : value(ticket),
    cac: positive(input.cac) ? value(input.cac) : missing('CAC ausente.'),
    churnMensalPercentual: churn === null ? missing('Churn mensal ausente.') : value(churn),
    retencaoAnualPercentual: retention === null ? missing('Retenção anual exige churn mensal.') : value(retention),
    paybackMeses: payback === null ? missing('Payback exige CAC, ticket e margem bruta maior que zero.') : value(payback),
    ltv: ltv === null ? missing(churn === 0 ? 'LTV indefinido quando churn é zero.' : 'LTV exige ticket, margem bruta e churn maior que zero.') : value(ltv),
    ltvCac: ltvCac === null ? missing('LTV/CAC exige LTV e CAC maior que zero.') : value(ltvCac),
  }
}
