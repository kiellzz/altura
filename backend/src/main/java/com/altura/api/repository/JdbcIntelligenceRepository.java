package com.altura.api.repository;

import com.altura.api.dto.IntelligenceDto.*;
import com.altura.api.exception.ApiException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcIntelligenceRepository implements IntelligenceRepository {
    private static final Logger log = LoggerFactory.getLogger(JdbcIntelligenceRepository.class);

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public JdbcIntelligenceRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void initSchema() {
        try {
            jdbc.execute("""
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
                      updated_at timestamptz not null default now()
                    );
                    create index if not exists questionario_usuario_idx
                      on public.startup_intelligence_questionario (usuario_id);
                    alter table public.startup_intelligence_questionario
                      add column if not exists margem_bruta_percentual numeric(5,2),
                      add column if not exists cac_estimado numeric(15,2),
                      add column if not exists churn_mensal_percentual numeric(5,2),
                      add column if not exists investimento_marketing_vendas_mensal numeric(15,2);

                    create table if not exists public.startup_intelligence_analise (
                      id bigint generated always as identity primary key,
                      usuario_id uuid not null references public.usuario(id) on delete cascade,
                      versao_beta boolean not null default true,
                      modelo_ia varchar(60) not null,
                      qualidade_dados text not null,
                      indicadores_financeiros text not null,
                      projecoes_crescimento text not null,
                      visao_geral text not null,
                      inteligencia_competitiva text not null,
                      recomendacoes text not null,
                      dados_origem_snapshot text not null,
                      created_at timestamptz not null default now()
                    );
                    create index if not exists analise_usuario_data_idx
                      on public.startup_intelligence_analise (usuario_id, created_at desc);
                    """);
            log.info("Esquema do Altura Intelligence verificado com sucesso.");
        } catch (Exception e) {
            log.warn("Nao foi possivel inicializar schema do Altura Intelligence automaticamente: {}", e.getMessage());
        }
    }

    @Override
    public Optional<QuestionnaireData> findQuestionnaire(UUID userId) {
        List<QuestionnaireData> results = jdbc.query("""
                select despesa_operacional_mensal, caixa_disponivel, margem_bruta_percentual,
                       cac_estimado, churn_mensal_percentual, evolucao_faturamento,
                       prioridade_principal, nicho_especifico, publico_alvo_regiao, diferencial_competitivo,
                       investimento_marketing_vendas_mensal
                from public.startup_intelligence_questionario
                where usuario_id = ?
                """, (rs, rowNum) -> mapQuestionnaire(rs), userId);
        return results.stream().findFirst();
    }

    @Override
    public QuestionnaireData saveQuestionnaire(UUID userId, QuestionnaireData q) {
        jdbc.update("""
                insert into public.startup_intelligence_questionario (
                    usuario_id, despesa_operacional_mensal, caixa_disponivel, evolucao_faturamento,
                    margem_bruta_percentual, cac_estimado, churn_mensal_percentual,
                    prioridade_principal, nicho_especifico, publico_alvo_regiao, diferencial_competitivo,
                    investimento_marketing_vendas_mensal, updated_at
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
                on conflict (usuario_id) do update set
                    despesa_operacional_mensal = excluded.despesa_operacional_mensal,
                    caixa_disponivel = excluded.caixa_disponivel,
                    evolucao_faturamento = excluded.evolucao_faturamento,
                    margem_bruta_percentual = excluded.margem_bruta_percentual,
                    cac_estimado = excluded.cac_estimado,
                    churn_mensal_percentual = excluded.churn_mensal_percentual,
                    prioridade_principal = excluded.prioridade_principal,
                    nicho_especifico = excluded.nicho_especifico,
                    publico_alvo_regiao = excluded.publico_alvo_regiao,
                    diferencial_competitivo = excluded.diferencial_competitivo,
                    investimento_marketing_vendas_mensal = excluded.investimento_marketing_vendas_mensal,
                    updated_at = now()
                """,
                userId, q.despesaOperacionalMensal(), q.caixaDisponivel(), q.evolucaoFaturamento(),
                q.margemBrutaPercentual(), q.cacEstimado(), q.churnMensalPercentual(),
                q.prioridadePrincipal(), q.nichoEspecifico(), q.publicoAlvoRegiao(), q.diferencialCompetitivo(), q.investimentoMarketingVendasMensal());
        return q;
    }

    @Override
    public Optional<IntelligenceReportResponse> findLatestReport(UUID userId) {
        List<IntelligenceReportResponse> list = jdbc.query("""
                select a.id, a.versao_beta, a.modelo_ia, a.qualidade_dados, a.indicadores_financeiros,
                       a.projecoes_crescimento, a.visao_geral, a.inteligencia_competitiva,
                       a.recomendacoes, a.dados_origem_snapshot, a.created_at
                from public.startup_intelligence_analise a
                where a.usuario_id = ?
                order by a.created_at desc, a.id desc
                limit 1
                """, (rs, rowNum) -> mapReport(rs), userId);
        return list.stream().findFirst();
    }

    @Override
    public IntelligenceReportResponse saveReport(UUID userId, IntelligenceReportResponse r, QuestionnaireData q) {
        try {
            Long reportId = jdbc.queryForObject("""
                    insert into public.startup_intelligence_analise (
                        usuario_id, versao_beta, modelo_ia, qualidade_dados, indicadores_financeiros,
                        projecoes_crescimento, visao_geral, inteligencia_competitiva, recomendacoes,
                        dados_origem_snapshot, created_at
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
                    returning id
                    """, Long.class,
                    userId,
                    r.versaoBeta(),
                    r.modeloIa(),
                    objectMapper.writeValueAsString(r.qualidadeDados()),
                    objectMapper.writeValueAsString(r.saudeFinanceira()),
                    objectMapper.writeValueAsString(r.crescimentoEProjecoes()),
                    objectMapper.writeValueAsString(r.visaoGeral()),
                    objectMapper.writeValueAsString(r.inteligenciaCompetitiva()),
                    objectMapper.writeValueAsString(r.recomendacoes()),
                    objectMapper.writeValueAsString(q)
            );

            return new IntelligenceReportResponse(
                    reportId != null ? reportId : 0L,
                    r.versaoBeta(),
                    r.avisoBetaCurto(),
                    r.avisoBetaCompleto(),
                    r.modeloIa(),
                    r.dataGeracao(),
                    r.qualidadeDados(),
                    r.saudeFinanceira(),
                    r.crescimentoEProjecoes(),
                    r.visaoGeral(),
                    r.inteligenciaCompetitiva(),
                    r.recomendacoes(),
                    q
            );
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao persistir relatorio Altura Intelligence: {}", e.getMessage(), e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível salvar o diagnóstico gerado. Tente novamente em instantes.");
        }
    }

    @Override
    public boolean hasReport(UUID userId) {
        Integer count = jdbc.queryForObject(
                "select count(*) from public.startup_intelligence_analise where usuario_id = ?",
                Integer.class, userId
        );
        return count != null && count > 0;
    }

    @Override
    public String findLatestReportDate(UUID userId) {
        return jdbc.query("""
                select created_at
                from public.startup_intelligence_analise
                where usuario_id = ?
                order by created_at desc
                limit 1
                """, (rs, rowNum) -> rs.getTimestamp("created_at").toInstant().toString(), userId)
                .stream().findFirst().orElse(null);
    }

    private QuestionnaireData mapQuestionnaire(ResultSet rs) throws SQLException {
        return new QuestionnaireData(
                rs.getBigDecimal("despesa_operacional_mensal"),
                rs.getBigDecimal("caixa_disponivel"),
                rs.getBigDecimal("margem_bruta_percentual"),
                rs.getBigDecimal("cac_estimado"),
                rs.getBigDecimal("churn_mensal_percentual"),
                rs.getString("evolucao_faturamento"),
                rs.getString("prioridade_principal"),
                rs.getString("nicho_especifico"),
                rs.getString("publico_alvo_regiao"),
                rs.getString("diferencial_competitivo"),
                rs.getBigDecimal("investimento_marketing_vendas_mensal")
        );
    }

    private IntelligenceReportResponse mapReport(ResultSet rs) throws SQLException {
        try {
            long id = rs.getLong("id");
            boolean beta = rs.getBoolean("versao_beta");
            String modeloIa = rs.getString("modelo_ia");
            String dataGeracao = rs.getTimestamp("created_at").toInstant().toString();

            DataQualityIndicator qualidade = objectMapper.readValue(
                    rs.getString("qualidade_dados"), DataQualityIndicator.class);
            FinancialIndicators financeiro = objectMapper.readValue(
                    rs.getString("indicadores_financeiros"), FinancialIndicators.class);
            GrowthProjections projecoes = objectMapper.readValue(
                    rs.getString("projecoes_crescimento"), GrowthProjections.class);
            ExecutiveOverview visaoGeral = objectMapper.readValue(
                    rs.getString("visao_geral"), ExecutiveOverview.class);
            CompetitiveIntelligence competitiva = objectMapper.readValue(
                    rs.getString("inteligencia_competitiva"), CompetitiveIntelligence.class);
            List<StrategicRecommendation> recomendacoes = objectMapper.readValue(
                    rs.getString("recomendacoes"), new TypeReference<List<StrategicRecommendation>>() {});

            QuestionnaireData q = objectMapper.readValue(
                    rs.getString("dados_origem_snapshot"), QuestionnaireData.class);

            return new IntelligenceReportResponse(
                    id,
                    beta,
                    "Análise gerada por inteligência artificial em versão BETA. Resultados estimados, sujeitos a imprecisões.",
                    "Esta ferramenta utiliza inteligência artificial para fornecer análises preliminares sobre o desempenho financeiro, crescimento e posicionamento de mercado da sua startup. Os resultados podem conter imprecisões e não possuem necessariamente o mesmo nível de profundidade ou confiabilidade de uma avaliação realizada por um consultor financeiro ou especialista de mercado. As informações apresentadas têm finalidade exclusivamente informativa e não constituem aconselhamento financeiro, contábil ou recomendação de investimento.",
                    modeloIa,
                    dataGeracao,
                    qualidade,
                    financeiro,
                    projecoes,
                    visaoGeral,
                    competitiva,
                    recomendacoes,
                    q
            );
        } catch (Exception e) {
            log.error("Erro ao desserializar relatorio do banco: {}", e.getMessage(), e);
            throw new SQLException("Falha ao ler dados da analise armazenada.", e);
        }
    }
}
