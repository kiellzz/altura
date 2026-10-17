package com.altura.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class IntelligenceDto {

    public record IntelligenceContextResponse(
            String nomeStartup,
            String descricao,
            String segmentoPrincipal,
            List<String> segmentosSecundarios,
            String cidade,
            String estado,
            LocalDate dataFundacao,
            BigDecimal receitaMensal,
            BigDecimal mrr,
            Integer clientesAtivos,
            Integer pilotosAtivos,
            BigDecimal crescimentoMensal,
            String evidenciaTracao,
            String mesReferencia,
            BigDecimal metaCaptacao,
            BigDecimal valorCaptado,
            QuestionnaireData ultimoQuestionario,
            boolean temRelatorioPrevio,
            String dataUltimoRelatorio
    ) {}

    public record QuestionnaireData(
            @NotNull(message = "Informe a despesa operacional mensal.")
            @DecimalMin(value = "0.0", message = "A despesa operacional mensal não pode ser negativa.")
            BigDecimal despesaOperacionalMensal,

            @NotNull(message = "Informe o saldo disponível em caixa.")
            @DecimalMin(value = "0.0", message = "O saldo disponível em caixa não pode ser negativo.")
            BigDecimal caixaDisponivel,

            @DecimalMin(value = "0.0", message = "A margem bruta não pode ser negativa.")
            @DecimalMax(value = "100.0", message = "A margem bruta não pode ser superior a 100%.")
            BigDecimal margemBrutaPercentual,

            @DecimalMin(value = "0.0", message = "O CAC estimado não pode ser negativo.")
            BigDecimal cacEstimado,

            @DecimalMin(value = "0.0", message = "O churn mensal não pode ser negativo.")
            @DecimalMax(value = "100.0", message = "O churn mensal não pode ser superior a 100%.")
            BigDecimal churnMensalPercentual,

            @NotBlank(message = "Selecione a evolução do faturamento nos últimos 3 meses.")
            String evolucaoFaturamento,

            @NotBlank(message = "Selecione a principal prioridade da startup.")
            String prioridadePrincipal,

            @NotBlank(message = "Informe o nicho específico de atuação.")
            @Size(min = 3, max = 300, message = "O nicho específico deve ter entre 3 e 300 caracteres.")
            String nichoEspecifico,

            @NotBlank(message = "Informe o público-alvo e a região de atuação.")
            @Size(min = 3, max = 300, message = "O público-alvo e região deve ter entre 3 e 300 caracteres.")
            String publicoAlvoRegiao,

            @Size(max = 500, message = "O diferencial competitivo deve ter até 500 caracteres.")
            String diferencialCompetitivo
    ) {}

    public record FinancialIndicators(
            BigDecimal receitaBaseMensal,
            BigDecimal despesaOperacionalMensal,
            @JsonAlias("resultadoOperacionalEstimado") BigDecimal saldoOperacionalSimplificado,
            BigDecimal consumoCaixaNetBurn,
            Double runwayMesesEstimado,
            String statusRunway,
            BigDecimal margemBrutaPercentual,
            BigDecimal lucroBrutoEstimado,
            BigDecimal cacEstimado,
            BigDecimal churnMensalPercentual,
            BigDecimal ticketMedioEstimado,
            String formulasEPremissas
    ) {}

    public record DataQualityIndicator(
            String status,
            String nivelRotulo,
            List<String> criteriosAtendidos,
            List<String> dadosFaltantesOuRecomendados,
            String orientacaoMelhoria
    ) {}

    public record GrowthScenario(
            String cenario,
            String descricaoPremissas,
            BigDecimal receitaProjetada3m,
            BigDecimal receitaProjetada6m,
            BigDecimal receitaProjetada12m,
            BigDecimal saldoOperacionalProjetado3m,
            BigDecimal saldoOperacionalProjetado6m,
            BigDecimal saldoOperacionalProjetado12m,
            BigDecimal caixaProjetado3m,
            BigDecimal caixaProjetado6m,
            BigDecimal caixaProjetado12m
    ) {}

    public record GrowthProjections(
            boolean possuiDadosProjecao,
            String analiseQualitativa,
            List<GrowthScenario> cenarios,
            String avisoSimulacao
    ) {}

    public record ExecutiveOverview(
            String resumoExecutivo,
            List<String> pontosFortes,
            List<String> pontosAtencao,
            List<String> limitacoesDados
    ) {}

    public record CompetitiveIntelligence(
            String contextualizacaoNicho,
            List<String> concorrentesIdentificados,
            String notaConcorrentesFontes,
            List<String> potenciaisVantagensCompetitivas,
            List<String> riscosMercado,
            List<String> oportunidadesPosicionamento
    ) {}

    public record StrategicRecommendation(
            String prioridade,
            String titulo,
            String descricao,
            String justificativaEDados
    ) {}

    public record IntelligenceReportResponse(
            long id,
            boolean versaoBeta,
            String avisoBetaCurto,
            String avisoBetaCompleto,
            String modeloIa,
            String dataGeracao,
            DataQualityIndicator qualidadeDados,
            FinancialIndicators saudeFinanceira,
            GrowthProjections crescimentoEProjecoes,
            ExecutiveOverview visaoGeral,
            CompetitiveIntelligence inteligenciaCompetitiva,
            List<StrategicRecommendation> recomendacoes,
            QuestionnaireData questionarioUtilizado
    ) {}
}
