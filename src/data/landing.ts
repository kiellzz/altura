export type TipoUsuario = 'startup' | 'investidor'
export type StatusRodada = 'aberta' | 'encerrada' | 'cancelada'

export interface Segmento { id: number; nome: string }
export interface Startup { id: number; nome: string; fase: string; descricao: string; segmento_id: number }
export interface Captacao {
  id: number
  startup_id: number
  valor_alvo: number
  valor_captado: number
  percentual_equity_oferecido: number
  status: StatusRodada
  data_inicio: string
  data_fim: string | null
}

export const navItems = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Para startups', href: '#para-startups' },
  { label: 'Para investidores', href: '#para-investidores' },
  { label: 'Segmentos', href: '#segmentos' },
  { label: 'FAQ', href: '#faq' },
] as const

export const hero = {
  title: 'Onde boas ideias encontram quem investe nelas.',
  description: 'A Altura aproxima startups em busca de capital e investidores em busca de oportunidades, com rodadas de captação claras, match por segmento e propostas em um só lugar.',
  actions: [
    { label: 'Sou startup', helper: 'Abra uma rodada de captação', href: '/cadastro/startup', type: 'startup' as TipoUsuario },
    { label: 'Sou investidor', helper: 'Encontre startups do seu interesse', href: '/cadastro/investidor', type: 'investidor' as TipoUsuario },
  ],
}

export const auth = {
  login: {
    eyebrow: 'Acesse sua conta',
    title: 'Entre para acompanhar suas conexões.',
    description: 'Visualize rodadas, propostas e conversas em um ambiente pensado para quem constrói e quem investe.',
    submitLabel: 'Entrar',
    alternateLabel: 'Ainda não tem conta?',
    alternateCta: 'Criar conta',
    alternateHref: '/cadastro',
    fields: [
      { id: 'email', label: 'E-mail', type: 'email', placeholder: 'voce@altura.com.br', autoComplete: 'email' },
      { id: 'password', label: 'Senha', type: 'password', placeholder: 'Sua senha', autoComplete: 'current-password' },
    ],
  },
  register: {
    eyebrow: 'Crie seu acesso',
    title: 'Comece pelo perfil certo para o seu momento.',
    description: 'Escolha como você quer usar a Altura e deixe a estrutura preparada para completar o cadastro depois.',
    submitLabel: 'Criar conta',
    alternateLabel: 'Já tem conta?',
    alternateCta: 'Entrar',
    alternateHref: '/login',
    roleLabel: 'Tipo de perfil',
    roles: [
      { type: 'startup' as TipoUsuario, label: 'Startup', description: 'Para abrir rodadas e receber propostas.' },
      { type: 'investidor' as TipoUsuario, label: 'Investidor', description: 'Para descobrir startups e enviar propostas.' },
    ],
    fields: [
      { id: 'email', label: 'E-mail', type: 'email', placeholder: 'voce@altura.com.br', autoComplete: 'email' },
      { id: 'password', label: 'Senha', type: 'password', placeholder: 'Crie uma senha', autoComplete: 'new-password' },
      { id: 'confirmPassword', label: 'Confirmar senha', type: 'password', placeholder: 'Repita a senha', autoComplete: 'new-password' },
    ],
  },
  sidePanel: {
    eyebrow: 'Altura',
    title: 'Uma entrada para dois fluxos de crescimento.',
    description: 'O mesmo padrão da landing segue aqui: interface clara, dados organizados e foco em aproximar bons projetos de capital inteligente.',
    stats: [
      { label: 'Perfis', value: '2' },
      { label: 'Segmentos', value: '10+' },
      { label: 'Status', value: 'Match' },
    ],
  },
  backHome: 'Voltar para o início',
} as const

export const segmentos: Segmento[] = [
  { id: 1, nome: 'Finanças' }, { id: 2, nome: 'Saúde' }, { id: 3, nome: 'Educação' },
  { id: 4, nome: 'Agricultura' }, { id: 5, nome: 'Logística' }, { id: 6, nome: 'Energia e sustentabilidade' },
  { id: 7, nome: 'Alimentação' }, { id: 8, nome: 'Varejo' }, { id: 9, nome: 'Governo e impacto social' },
  { id: 10, nome: 'Software e serviços digitais' },
]

export const startupExemplo: Startup = {
  id: 1,
  nome: 'Aurora Pay',
  fase: 'MVP',
  descricao: 'Plataforma fictícia de serviços financeiros.',
  segmento_id: 1,
}

export const captacaoExemplo: Captacao = {
  id: 1,
  startup_id: 1,
  valor_alvo: 500000,
  valor_captado: 180000,
  percentual_equity_oferecido: 7.5,
  status: 'aberta',
  data_inicio: '2026-09-01',
  data_fim: null,
}

export const steps = [
  {
    number: '01',
    title: 'Crie seu perfil',
    description: 'Startups informam CNPJ, fase, segmento e descrição; investidores informam biografia, faixa de investimento e segmentos de interesse.',
  },
  {
    number: '02',
    title: 'Descubra e dê match',
    description: 'Startups abrem rodadas de captação; investidores exploram as rodadas abertas e enviam propostas.',
  },
  {
    number: '03',
    title: 'Negocie a proposta',
    description: 'A startup aceita ou recusa, e ambos acompanham o status de cada conversa em um só lugar.',
  },
] as const

export const audiences = [
  {
    type: 'startup' as TipoUsuario,
    eyebrow: 'Para startups',
    title: 'Capte com clareza, do perfil à proposta.',
    items: [
      'Cadastre sua startup com CNPJ, fase, segmento e descrição.',
      'Abra uma rodada: meta, % de equity e período.',
      'Receba propostas e responda: aceitar ou recusar.',
      'Acompanhe o valor captado até a meta.',
    ],
    cta: 'Cadastrar minha startup',
    href: '/cadastro/startup',
  },
  {
    type: 'investidor' as TipoUsuario,
    eyebrow: 'Para investidores',
    title: 'Encontre oportunidades alinhadas à sua tese.',
    items: [
      'Monte seu perfil com biografia e tipo de investidor.',
      'Defina sua faixa de investimento (mínimo e máximo).',
      'Escolha segmentos de interesse e explore rodadas abertas.',
      'Envie propostas e acompanhe: pendente, aceita ou recusada.',
    ],
    cta: 'Cadastrar como investidor',
    href: '/cadastro/investidor',
  },
] as const

export const faqs = [
  { question: 'Quem pode se cadastrar?', answer: 'Startups (com CNPJ) e investidores (com CPF). Cada conta tem um único perfil: startup ou investidor.' },
  { question: 'O que é um match?', answer: 'Quando um investidor envia uma proposta a uma rodada, criamos um match entre os dois. A startup pode aceitar ou recusar.' },
  { question: 'O que preciso para cadastrar minha startup?', answer: 'Nome, CNPJ, fase, segmento e uma breve descrição. Depois, abra sua rodada com meta, % de equity e período.' },
  { question: 'Como informo quanto quero investir?', answer: 'No perfil de investidor você define o valor mínimo e o máximo e os segmentos de interesse.' },
] as const

export const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const percentFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
