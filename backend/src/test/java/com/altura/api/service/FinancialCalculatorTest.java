package com.altura.api.service;

import com.altura.api.dto.IntelligenceDto.*;
import com.altura.api.dto.StartupProfileResponse;
import com.altura.api.dto.StartupProfileResponse.RoundData;
import com.altura.api.dto.StartupProfileResponse.TractionData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FinancialCalculatorTest {

    private FinancialCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new FinancialCalculator();
    }

    private StartupProfileResponse createProfile(BigDecimal receita, BigDecimal mrr, BigDecimal crescimento) {
        String currentMonth = YearMonth.now().toString();
        TractionData traction = new TractionData(
                currentMonth,
                receita,
                mrr,
                15,
                2,
                crescimento,
                "Mais de 15 clientes B2B pagantes e 2 pilotos em andamento."
        );
        RoundData round = new RoundData(
                BigDecimal.valueOf(500000),
                BigDecimal.valueOf(100000),
                BigDecimal.valueOf(10.0),
                "aberta",
                LocalDate.now().plusMonths(6)
        );
        return new StartupProfileResponse(
                "Fundador Teste",
                "Startup Teste",
                "12345678000199",
                "Tração",
                1L,
                "Plataforma SaaS para gestão de frotas e logística.",
                null,
                LocalDate.of(2023, 1, 1),
                "https://startupteste.com",
                "São Paulo, SP",
                "São Paulo",
                "SP",
                -23.55,
                -46.63,
                null,
                List.of(2L),
                "https://linkedin.com/company/startupteste",
                round,
                traction
        );
    }

    private QuestionnaireData createQuestionnaire(BigDecimal despesas, BigDecimal caixa, String evolucao) {
        return new QuestionnaireData(
                despesas,
                caixa,
                BigDecimal.valueOf(70),
                BigDecimal.valueOf(1200),
                BigDecimal.valueOf(2.5),
                evolucao,
                "acelerar_crescimento",
                "SaaS de gestão de frotas para transportadoras médias",
                "Pequenas e médias transportadoras do Sudeste e Sul",
                "Algoritmo próprio de telemetria preditiva com economia de 18% em diesel"
        );
    }

    @Test
    void testNetBurnAndRunwayWhenBurningCash() {
        StartupProfileResponse profile = createProfile(BigDecimal.valueOf(30000), BigDecimal.valueOf(30000), BigDecimal.valueOf(5.0));
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(50000), BigDecimal.valueOf(200000), "crescimento_consistente");

        FinancialIndicators indicators = calculator.calculateFinancialIndicators(profile, q);

        assertEquals(BigDecimal.valueOf(30000), indicators.receitaBaseMensal());
        assertEquals(BigDecimal.valueOf(50000), indicators.despesaOperacionalMensal());
        assertEquals(BigDecimal.valueOf(-20000), indicators.saldoOperacionalSimplificado());
        assertEquals(BigDecimal.valueOf(20000), indicators.consumoCaixaNetBurn());
        assertNotNull(indicators.runwayMesesEstimado());
        assertEquals(10.0, indicators.runwayMesesEstimado(), 0.1);
        assertEquals("alerta", indicators.statusRunway());
    }

    @Test
    void testSustainableWhenBreakEvenOrProfitable() {
        StartupProfileResponse profile = createProfile(BigDecimal.valueOf(60000), BigDecimal.valueOf(60000), BigDecimal.valueOf(10.0));
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(45000), BigDecimal.valueOf(150000), "crescimento_consistente");

        FinancialIndicators indicators = calculator.calculateFinancialIndicators(profile, q);

        assertEquals(BigDecimal.valueOf(60000), indicators.receitaBaseMensal());
        assertEquals(BigDecimal.valueOf(15000), indicators.saldoOperacionalSimplificado());
        assertEquals(BigDecimal.ZERO, indicators.consumoCaixaNetBurn());
        assertNull(indicators.runwayMesesEstimado());
        assertEquals("sustentavel", indicators.statusRunway());
    }

    @Test
    void testCriticalRunwayWhenNoCashAndBurning() {
        StartupProfileResponse profile = createProfile(BigDecimal.valueOf(10000), BigDecimal.valueOf(10000), BigDecimal.valueOf(2.0));
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(30000), BigDecimal.ZERO, "oscilando");

        FinancialIndicators indicators = calculator.calculateFinancialIndicators(profile, q);

        assertEquals(BigDecimal.valueOf(20000), indicators.consumoCaixaNetBurn());
        assertEquals(0.0, indicators.runwayMesesEstimado());
        assertEquals("critico", indicators.statusRunway());
    }

    @Test
    void testProjectionsWithPositiveRevenue() {
        StartupProfileResponse profile = createProfile(BigDecimal.valueOf(50000), BigDecimal.valueOf(50000), BigDecimal.valueOf(8.0));
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(40000), BigDecimal.valueOf(300000), "crescimento_consistente");

        FinancialIndicators fi = calculator.calculateFinancialIndicators(profile, q);
        GrowthProjections projections = calculator.calculateProjections(profile, q, fi);

        assertTrue(projections.possuiDadosProjecao());
        assertEquals(3, projections.cenarios().size());

        GrowthScenario conservador = projections.cenarios().stream()
                .filter(c -> "Conservador".equals(c.cenario())).findFirst().orElseThrow();
        GrowthScenario base = projections.cenarios().stream()
                .filter(c -> "Base".equals(c.cenario())).findFirst().orElseThrow();
        GrowthScenario otimista = projections.cenarios().stream()
                .filter(c -> "Otimista".equals(c.cenario())).findFirst().orElseThrow();

        assertTrue(otimista.receitaProjetada12m().compareTo(base.receitaProjetada12m()) > 0);
        assertTrue(base.receitaProjetada12m().compareTo(conservador.receitaProjetada12m()) >= 0);
        assertTrue(base.receitaProjetada12m().compareTo(fi.receitaBaseMensal()) > 0);
    }

    @Test
    void testProjectionsWhenPreRevenue() {
        StartupProfileResponse profile = createProfile(BigDecimal.ZERO, BigDecimal.ZERO, null);
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(15000), BigDecimal.valueOf(50000), "nao_informado");

        FinancialIndicators fi = calculator.calculateFinancialIndicators(profile, q);
        GrowthProjections projections = calculator.calculateProjections(profile, q, fi);

        assertFalse(projections.possuiDadosProjecao());
        assertTrue(projections.cenarios().isEmpty());
        assertTrue(projections.analiseQualitativa().contains("extrapolações sem base factual"));
    }

    @Test
    void testDataQualityEvaluation() {
        StartupProfileResponse profile = createProfile(BigDecimal.valueOf(40000), BigDecimal.valueOf(40000), BigDecimal.valueOf(6.0));
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(30000), BigDecimal.valueOf(100000), "crescimento_consistente");

        DataQualityIndicator qi = calculator.evaluateDataQuality(profile, q);

        assertEquals("suficiente", qi.status());
        assertFalse(qi.criteriosAtendidos().isEmpty());
        assertNotNull(qi.nivelRotulo());
    }

    @Test
    void calculatesInvestorMetricsWithoutCallingAi() {
        StartupProfileResponse profile = createProfile(BigDecimal.valueOf(30000), BigDecimal.valueOf(30000), BigDecimal.valueOf(5.0));
        QuestionnaireData q = createQuestionnaire(BigDecimal.valueOf(50000), BigDecimal.valueOf(200000), "crescimento_consistente");

        FinancialIndicators indicators = calculator.calculateFinancialIndicators(profile, q);

        assertEquals(new BigDecimal("70"), indicators.margemBrutaPercentual());
        assertEquals(new BigDecimal("21000.00"), indicators.lucroBrutoEstimado());
        assertEquals(new BigDecimal("1200"), indicators.cacEstimado());
        assertEquals(new BigDecimal("2.5"), indicators.churnMensalPercentual());
        assertEquals(new BigDecimal("2000.00"), indicators.ticketMedioEstimado());
    }
}
