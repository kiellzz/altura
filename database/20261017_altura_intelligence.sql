-- Altura Intelligence (BETA) - Tabelas de persistência
-- Armazena as respostas do questionário complementar e os relatórios analíticos gerados pela IA.

begin;

create table if not exists public.startup_intelligence_questionario (
  id bigint generated always as identity primary key,
  usuario_id uuid not null unique references public.usuario(id) on delete cascade,
  despesa_operacional_mensal numeric(15,2) not null,
  caixa_disponivel numeric(15,2) not null,
  margem_bruta_percentual numeric(5,2),
  cac_estimado numeric(15,2),
  churn_mensal_percentual numeric(5,2),
  evolucao_faturamento varchar(30) not null,
  prioridade_principal varchar(40) not null,
  nicho_especifico varchar(300) not null,
  publico_alvo_regiao varchar(300) not null,
  diferencial_competitivo varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questionario_despesa_positiva check (despesa_operacional_mensal >= 0),
  constraint questionario_caixa_positivo check (caixa_disponivel >= 0),
  constraint questionario_margem_bruta_valida check (margem_bruta_percentual is null or margem_bruta_percentual between 0 and 100),
  constraint questionario_cac_valido check (cac_estimado is null or cac_estimado >= 0),
  constraint questionario_churn_valido check (churn_mensal_percentual is null or churn_mensal_percentual between 0 and 100),
  constraint questionario_evolucao_valida check (
    evolucao_faturamento in ('crescimento_consistente', 'estavel', 'oscilando', 'em_queda', 'nao_informado')
  ),
  constraint questionario_prioridade_valida check (
    prioridade_principal in ('acelerar_crescimento', 'reduzir_custos', 'captar_investimentos', 'aquisicao_clientes', 'retencao_clientes', 'aumentar_rentabilidade')
  ),
  constraint questionario_nicho_tamanho check (char_length(btrim(nicho_especifico)) between 3 and 300),
  constraint questionario_publico_tamanho check (char_length(btrim(publico_alvo_regiao)) between 3 and 300),
  constraint questionario_diferencial_tamanho check (diferencial_competitivo is null or char_length(btrim(diferencial_competitivo)) <= 500)
);

create index if not exists questionario_usuario_idx
  on public.startup_intelligence_questionario (usuario_id);

create table if not exists public.startup_intelligence_analise (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  versao_beta boolean not null default true,
  modelo_ia varchar(60) not null,
  qualidade_dados text not null, -- JSON serializado
  indicadores_financeiros text not null, -- JSON serializado
  projecoes_crescimento text not null, -- JSON serializado
  visao_geral text not null, -- JSON serializado
  inteligencia_competitiva text not null, -- JSON serializado
  recomendacoes text not null, -- JSON serializado
  dados_origem_snapshot text not null, -- JSON serializado
  created_at timestamptz not null default now()
);

create index if not exists analise_usuario_data_idx
  on public.startup_intelligence_analise (usuario_id, created_at desc);

commit;
