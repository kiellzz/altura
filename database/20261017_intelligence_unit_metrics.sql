-- Métricas essenciais de unit economics para o Altura Intelligence.
alter table public.startup_intelligence_questionario
  add column if not exists margem_bruta_percentual numeric(5,2),
  add column if not exists cac_estimado numeric(15,2),
  add column if not exists churn_mensal_percentual numeric(5,2);

alter table public.startup_intelligence_questionario
  drop constraint if exists questionario_margem_bruta_valida,
  drop constraint if exists questionario_cac_valido,
  drop constraint if exists questionario_churn_valido;

alter table public.startup_intelligence_questionario
  add constraint questionario_margem_bruta_valida check (margem_bruta_percentual is null or margem_bruta_percentual between 0 and 100),
  add constraint questionario_cac_valido check (cac_estimado is null or cac_estimado >= 0),
  add constraint questionario_churn_valido check (churn_mensal_percentual is null or churn_mensal_percentual between 0 and 100);
