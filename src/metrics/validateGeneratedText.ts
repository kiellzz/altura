import type { Metrics } from './calculate'

const values = (metrics: Metrics): number[] => Object.values(metrics).flatMap((m) => m.valor === null ? [] : [m.valor])

export function validateGeneratedText(text: string, metrics: Metrics): { valido: boolean; numerosDesconhecidos: string[] } {
  const numbers = [...text.matchAll(/\b\d+(?:[.,]\d+)?\b/g)].map((m) => Number(m[0].replace(',', '.'))).filter(Number.isFinite)
  const known = values(metrics)
  const unknown = numbers.filter((number) => !known.some((knownNumber) => Math.abs(knownNumber - number) < 0.011))
  return { valido: unknown.length === 0, numerosDesconhecidos: unknown.map(String) }
}

export function templateExecutiveText(metrics: Metrics): string {
  const missing = Object.values(metrics).filter((metric) => metric.valor === null).map((metric) => metric.motivo).filter(Boolean).join(' ')
  return `Resumo determinístico: os indicadores foram calculados a partir dos dados informados. ${missing ? `Não foi possível calcular: ${missing}` : 'Todas as métricas mínimas foram calculadas.'}`
}
