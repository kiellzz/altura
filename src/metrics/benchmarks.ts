export type Confidence = 'alta' | 'heuristica'

export interface BenchmarkSource {
  autor: string
  titulo: string
  url: string
}

export interface Benchmark {
  metrica: string
  min?: number
  max?: number
  unidade: 'percentual' | 'meses' | 'multiplo'
  fonte: BenchmarkSource
  contexto: string
  confianca: Confidence
  nota?: string
  visivelNaMetodologia?: boolean
}

export const SOURCES = {
  skok: {
    autor: 'David Skok',
    titulo: 'SaaS Metrics 2.0 — Detailed Definitions',
    url: 'https://www.forentrepreneurs.com/saas-metrics-2-definitions/',
  },
  a16z: {
    autor: 'Jeff Jordan, Anu Hariharan, Frank Chen e Preethi Kasireddy',
    titulo: '16 Startup Metrics',
    url: 'https://a16z.com/16-startup-metrics/',
  },
} as const

// A a16z define as métricas, mas não publica faixas comparativas para estes limites.
// Portanto, os limites abaixo são regras heurísticas explicitamente marcadas.
export const BENCHMARKS: Record<string, Benchmark> = {
  churnMensal: {
    metrica: 'Churn mensal', min: 0, max: 1, unidade: 'percentual', fonte: SOURCES.skok,
    contexto: 'SaaS B2B para PMEs; referência operacional, não estudo estatístico', confianca: 'heuristica',
    nota: 'A fonte não confirma estas faixas para churn mensal de clientes. O limite inferior a 1% publicado refere-se a churn bruto de receita, que é outra métrica.',
  },
  payback: {
    metrica: 'Payback de CAC', max: 12, unidade: 'meses', fonte: SOURCES.skok,
    contexto: 'SaaS recorrente; meta publicada para recuperação do CAC', confianca: 'alta',
    nota: 'David Skok publica a diretriz de 12 meses ou menos, ressalvando que empresas saudáveis podem operar perto de 20 meses conforme acesso a capital.',
  },
  ltvCac: {
    metrica: 'LTV/CAC', min: 3, unidade: 'multiplo', fonte: SOURCES.skok,
    contexto: 'SaaS recorrente; unit economics com margem bruta alta', confianca: 'alta',
    nota: 'A fonte recomenda relação superior a 3 e explicita a premissa de margem bruta de 80% ou mais na fórmula simplificada.',
  },
  paybackAtipico: {
    metrica: 'Payback de CAC atípico', max: 3, unidade: 'meses', fonte: SOURCES.skok,
    contexto: 'Sanity check interno; não é uma faixa publicada pela fonte', confianca: 'heuristica',
    nota: 'O limite inferior a 3 meses é regra própria para revisão de inputs.', visivelNaMetodologia: false,
  },
  ltvCacAtipico: {
    metrica: 'LTV/CAC atípico', min: 10, unidade: 'multiplo', fonte: SOURCES.skok,
    contexto: 'Sanity check interno; não é uma faixa publicada pela fonte', confianca: 'heuristica',
    nota: 'O limite superior a 10x é regra própria para revisão de inputs.', visivelNaMetodologia: false,
  },
  margemBruta: {
    metrica: 'Margem bruta', unidade: 'percentual', fonte: SOURCES.a16z,
    contexto: 'Definição de gross profit em produtos/serviços; sem faixa comparativa', confianca: 'alta',
  },
  mrr: {
    metrica: 'MRR', unidade: 'percentual', fonte: SOURCES.a16z,
    contexto: 'Receita recorrente mensal; excluir itens não recorrentes', confianca: 'alta',
  },
  churnDefinicao: {
    metrica: 'Churn mensal', unidade: 'percentual', fonte: SOURCES.a16z,
    contexto: 'Churn de clientes = clientes perdidos / total de clientes do mês anterior', confianca: 'alta',
  },
  burnRunway: {
    metrica: 'Burn e runway', unidade: 'meses', fonte: SOURCES.a16z,
    contexto: 'Startup; net burn considera receita e runway considera caixa disponível', confianca: 'alta',
  },
}

export const allBenchmarks = (): Benchmark[] => Object.values(BENCHMARKS).filter((benchmark) => benchmark.visivelNaMetodologia !== false)
