interface ApiLikeError {
  status?: number
  message?: string
}

export function traduzirErroApi(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Não foi possível salvar. Tente novamente em instantes.'
  const apiError = error as ApiLikeError
  if (apiError.status === 401 || apiError.status === 403) {
    return 'Sua sessão expirou ou não tem permissão. Entre novamente.'
  }
  if (apiError.status === 409) return apiError.message ?? 'Já existe um cadastro com esses dados.'
  // Erros de cliente (4xx) com mensagem do servidor: exibir diretamente
  if (apiError.message && apiError.status && apiError.status < 500) return apiError.message
  // Erros de servidor com mensagem descritiva (503 = IA indisponível, 502 = falha no provedor, 504 = timeout)
  if (apiError.message && apiError.status && [502, 503, 504, 429].includes(apiError.status)) {
    return apiError.message
  }
  return 'Não foi possível salvar. Verifique os dados e tente novamente.'
}

