const numberFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const numberFormatter2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatBRL(value: number | null | undefined): string {
  return value === null || value === undefined || Number.isNaN(value) ? 'Não informado' : currencyFormatter.format(value)
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined || Number.isNaN(value) ? 'Não informado' : (digits === 2 ? numberFormatter2 : numberFormatter).format(value)
}

export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined || Number.isNaN(value) ? 'Não informado' : `${formatNumber(value)}%`
}
