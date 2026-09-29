const draftPrefix = 'altura:perfil-draft:'

function getDraftKey(userId: string, tipo: string) {
  return `${draftPrefix}${tipo}:${userId}`
}

export function carregarRascunho<T>(userId: string, tipo: string): T | null {
  try {
    const value = localStorage.getItem(getDraftKey(userId, tipo))
    return value ? JSON.parse(value) as T : null
  } catch {
    return null
  }
}

export function salvarRascunho<T>(userId: string, tipo: string, value: T) {
  try {
    localStorage.setItem(getDraftKey(userId, tipo), JSON.stringify(value))
  } catch {
    // Rascunhos são uma conveniência; falhas de armazenamento não devem bloquear o formulário.
  }
}

export function limparRascunho(userId: string, tipo: string) {
  try {
    localStorage.removeItem(getDraftKey(userId, tipo))
  } catch {
    // Ignore storage failures during cleanup.
  }
}
