import { BENCHMARKS, type Benchmark } from './benchmarks'
import type { Metrics } from './calculate'

export type RuleType = 'forte' | 'atencao' | 'sanidade'
export interface RuleFlag {
  id: string
  tipo: RuleType
  metrica: string
  valor: number | null
  faixa: string
  fonte: Benchmark
}

const flag = (id: string, tipo: RuleType, metrica: string, valor: number | null, faixa: string, fonte: Benchmark): RuleFlag => ({ id, tipo, metrica, valor, faixa, fonte })

export function evaluateRules(metrics: Metrics): RuleFlag[] {
  const flags: RuleFlag[] = []
  const churn = metrics.churnMensalPercentual.valor
  if (churn !== null) {
    const b = BENCHMARKS.churnMensal
    flags.push(churn < 1 ? flag('churn_excelente', 'forte', b.metrica, churn, '< 1%', b) : churn <= 3 ? flag('churn_aceitavel', 'forte', b.metrica, churn, '1% a 3%', b) : flag('churn_atencao', 'atencao', b.metrica, churn, '> 3%', b))
  }
  const payback = metrics.paybackMeses.valor
  if (payback !== null) {
    const b = BENCHMARKS.payback
    flags.push(payback <= 12 ? flag('payback_saudavel', 'forte', b.metrica, payback, 'até 12 meses', b) : flag('payback_longo', 'atencao', b.metrica, payback, '> 12 meses', b))
  }
  const ratio = metrics.ltvCac.valor
  if (ratio !== null) {
    const b = BENCHMARKS.ltvCac
    flags.push(ratio >= 3 ? flag('ltv_cac_forte', 'forte', b.metrica, ratio, '≥ 3x', b) : flag('ltv_cac_baixo', 'atencao', b.metrica, ratio, '< 3x', b))
    if (ratio > 10) flags.push(flag('ltv_cac_atipico', 'sanidade', BENCHMARKS.ltvCacAtipico.metrica, ratio, '> 10x', BENCHMARKS.ltvCacAtipico))
  }
  if (payback !== null && payback < 3) flags.push(flag('payback_atipico', 'sanidade', BENCHMARKS.paybackAtipico.metrica, payback, '< 3 meses', BENCHMARKS.paybackAtipico))
  if (metrics.netBurn.valor !== null && metrics.netBurn.valor <= 0) flags.push(flag('runway_infinito', 'forte', 'Runway', null, 'net burn ≤ 0', BENCHMARKS.burnRunway))
  return flags
}
