package com.altura.api.service;

import com.altura.api.dto.IntelligenceDto.*;
import com.altura.api.dto.StartupProfileResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Component
public class FinancialCalculator {

    public FinancialIndicators calculateFinancialIndicators(StartupProfileResponse profile, QuestionnaireData q) {
        BigDecimal mrr = profile.tracao() != null ? profile.tracao().mrr() : null;
        BigDecimal receitaMensal = profile.tracao() != null ? profile.tracao().receitaMensal() : null;

        BigDecimal receitaBase = BigDecimal.ZERO;
        if (mrr != null && mrr.compareTo(BigDecimal.ZERO) > 0) {
            receitaBase = mrr;
        } else if (receitaMensal != null && receitaMensal.compareTo(BigDecimal.ZERO) > 0) {
            receitaBase = receitaMensal;
        }

        BigDecimal despesas = q.despesaOperacionalMensal() != null ? q.despesaOperacionalMensal() : BigDecimal.ZERO;
        BigDecimal caixa = q.caixaDisponivel() != null ? q.caixaDisponivel() : BigDecimal.ZERO;

        BigDecimal saldoOperacional = receitaBase.subtract(despesas);

        BigDecimal netBurn;
        Double runwayMeses;
        String statusRunway;

        if (saldoOperacional.compareTo(BigDecimal.ZERO) >= 0) {
            netBurn = BigDecimal.ZERO;
            runwayMeses = null;
            statusRunway = "sustentavel";
        } else {
            netBurn = despesas.subtract(receitaBase);
            if (caixa.compareTo(BigDecimal.ZERO) <= 0) {
                runwayMeses = 0.0;
                statusRunway = "critico";
            } else if (netBurn.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal runway = caixa.divide(netBurn, 1, RoundingMode.HALF_UP);
                runwayMeses = runway.doubleValue();
                if (runwayMeses >= 18.0) {
                    statusRunway = "confortavel";
                } else if (runwayMeses >= 6.0) {
                    statusRunway = "alerta";
                } else {
                    statusRunway = "critico";
                }
            } else {
                runwayMeses = null;
                statusRunway = "sustentavel";
            }
        }

        BigDecimal margemBruta = q.margemBrutaPercentual();
        BigDecimal lucroBruto = margemBruta != null
                ? receitaBase.multiply(margemBruta).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : null;
        BigDecimal ticketMedio = null;
        if (profile.tracao() != null && profile.tracao().clientesAtivos() != null
                && profile.tracao().clientesAtivos() > 0 && receitaBase.compareTo(BigDecimal.ZERO) > 0) {
            ticketMedio = receitaBase.divide(BigDecimal.valueOf(profile.tracao().clientesAtivos()), 2, RoundingMode.HALF_UP);
        }

        String formulas = "Saldo Operacional Simplificado = Receita Base Mensal (R$ " + receitaBase + ") - Despesa Mensal Informada (R$ " + despesas + "). " +
                "Consumo Líquido (Net Burn) considera as receitas como compensação operacional. " +
                "Runway = Saldo em Caixa (R$ " + caixa + ") / Consumo Líquido Mensal. " +
                "Ticket Médio = Receita Base / Clientes Ativos. " +
                "É uma visão gerencial simplificada: não equivale a lucro contábil, DRE ou fluxo de caixa auditado e não presume capital futuro.";

        return new FinancialIndicators(
                receitaBase,
                despesas,
                saldoOperacional,
                netBurn,
                runwayMeses,
                statusRunway,
                margemBruta,
                lucroBruto,
                q.cacEstimado(),
                q.churnMensalPercentual(),
                ticketMedio,
                formulas
        );
    }

    public GrowthProjections calculateProjections(StartupProfileResponse profile, QuestionnaireData q, FinancialIndicators fi) {
        BigDecimal receitaBase = fi.receitaBaseMensal();

        if (receitaBase == null || receitaBase.compareTo(BigDecimal.ZERO) <= 0) {
            return new GrowthProjections(
                    false,
                    "A startup não informou receita mensal ou MRR positivo consolidado no cadastro. " +
                            "Projeções financeiras quantitativas neste estágio dependeriam de extrapolações sem base factual verificável. " +
                            "Recomenda-se focar na validação de proposta de valor, pilotos ativos e primeiros clientes pagantes.",
                    List.of(),
                    "Simulações determinísticas indisponíveis devido à ausência de histórico de faturamento."
            );
        }

        Double trendRate = null;
        String evolucao = q.evolucaoFaturamento() != null ? q.evolucaoFaturamento() : "estavel";
        switch (evolucao) {
            case "crescimento_consistente" -> trendRate = 0.04;
            case "estavel", "oscilando" -> trendRate = 0.0;
            case "em_queda" -> trendRate = -0.03;
            default -> { }
        }

        Double historicalRate = null;
        if (profile.tracao() != null && profile.tracao().crescimentoMensal() != null) {
            double hist = profile.tracao().crescimentoMensal().doubleValue() / 100.0;
            if (hist >= -0.20 && hist <= 0.30) {
                historicalRate = hist;
            }
        }

        if (historicalRate == null && trendRate == null) {
            return new GrowthProjections(false,
                    "Não há taxa histórica confiável nem tendência recente suficiente para simular crescimento quantitativo.",
                    List.of(), "Informe a evolução recente ou atualize a taxa de crescimento mensal para habilitar cenários.");
        }

        double baseMonthlyRate = historicalRate != null && trendRate != null
                ? historicalRate * 0.70 + trendRate * 0.30
                : historicalRate != null ? historicalRate : trendRate;
        baseMonthlyRate = clamp(baseMonthlyRate, -0.10, 0.15);

        double spread = Math.max(0.02, Math.abs(baseMonthlyRate) * 0.5);
        double rateConservador = clamp(baseMonthlyRate - spread, -0.10, 0.10);
        double rateBase = baseMonthlyRate;
        double rateOtimista = clamp(baseMonthlyRate + spread, -0.05, 0.15);

        List<GrowthScenario> cenarios = new ArrayList<>();

        cenarios.add(buildScenario("Conservador", rateConservador,
                "reduz a tendência base para absorver fricções, sazonalidade e ciclo de vendas mais longo",
                receitaBase, fi.despesaOperacionalMensal(), q.caixaDisponivel()));

        cenarios.add(buildScenario("Base", rateBase,
                "combina 70% da taxa histórica válida com 30% da tendência declarada, quando ambas existem",
                receitaBase, fi.despesaOperacionalMensal(), q.caixaDisponivel()));

        cenarios.add(buildScenario("Otimista", rateOtimista,
                "adiciona uma faixa prudencial de aceleração, limitada a 15% ao mês",
                receitaBase, fi.despesaOperacionalMensal(), q.caixaDisponivel()));

        return new GrowthProjections(
                true,
                "Simulações condicionais baseadas na receita atual, tendência recente e taxa histórica disponível, com crescimento mensal limitado entre -10% e 15%.",
                cenarios,
                "As despesas são mantidas constantes para tornar a premissa auditável. Caixa projetado soma os saldos mensais simplificados e nunca presume aportes. Não é orçamento nem previsão garantida."
        );
    }

    public DataQualityIndicator evaluateDataQuality(StartupProfileResponse profile, QuestionnaireData q) {
        List<String> atendidos = new ArrayList<>();
        List<String> faltantes = new ArrayList<>();

        if (profile.nomeStartup() != null && !profile.nomeStartup().isBlank()) {
            atendidos.add("Identificação da startup e proposta cadastrada");
        }
        if (profile.segmentoId() > 0) {
            atendidos.add("Segmento de mercado principal definido");
        }

        boolean temReceita = false;
        if (profile.tracao() != null) {
            if ((profile.tracao().receitaMensal() != null && profile.tracao().receitaMensal().compareTo(BigDecimal.ZERO) > 0) ||
                (profile.tracao().mrr() != null && profile.tracao().mrr().compareTo(BigDecimal.ZERO) > 0)) {
                atendidos.add("Receita mensal / MRR consolidado");
                temReceita = true;
            } else {
                faltantes.add("Métricas financeiras de faturamento (Receita ou MRR)");
            }

            if (profile.tracao().clientesAtivos() != null || profile.tracao().pilotosAtivos() != null) {
                atendidos.add("Métricas de tração comercial (clientes/pilotos)");
            } else {
                faltantes.add("Número de clientes ou pilotos ativos");
            }

            if (profile.tracao().crescimentoMensal() != null) {
                atendidos.add("Histórico de taxa de crescimento mensal");
            } else {
                faltantes.add("Taxa histórica de crescimento mensal");
            }

            if (profile.tracao().mesReferencia() != null) {
                try {
                    YearMonth ref = YearMonth.parse(profile.tracao().mesReferencia());
                    YearMonth now = YearMonth.now();
                    if (!ref.isBefore(now.minusMonths(6))) {
                        atendidos.add("Mês de referência recente dos indicadores");
                    } else {
                        faltantes.add("Atualização do mês de referência dos indicadores (superior a 6 meses)");
                    }
                } catch (DateTimeParseException ignored) {
                    faltantes.add("Mês de referência dos indicadores válido");
                }
            }
        } else {
            faltantes.add("Métricas de tração da startup");
        }

        if (q.despesaOperacionalMensal() != null && q.despesaOperacionalMensal().compareTo(BigDecimal.ZERO) > 0) {
            atendidos.add("Despesa operacional mensal informada");
        } else {
            faltantes.add("Despesa operacional mensal detalhada");
        }

        if (q.caixaDisponivel() != null) {
            atendidos.add("Saldo de caixa disponível em conta informado");
        } else {
            faltantes.add("Saldo de caixa disponível em conta");
        }

        if (q.diferencialCompetitivo() != null && !q.diferencialCompetitivo().isBlank()) {
            atendidos.add("Diferencial competitivo informado");
        } else {
            faltantes.add("Diferencial competitivo detalhado");
        }

        if (q.margemBrutaPercentual() != null) atendidos.add("Margem bruta informada");
        else faltantes.add("Margem bruta para avaliar qualidade econômica da receita");
        if (q.cacEstimado() != null) atendidos.add("CAC estimado informado");
        else faltantes.add("CAC para avaliar eficiência de aquisição");
        if (q.churnMensalPercentual() != null) atendidos.add("Churn mensal informado");
        else faltantes.add("Churn mensal para avaliar retenção");

        int score = atendidos.size();
        String status;
        String rotulo;
        String orientacao;

        if (score >= 6 && temReceita) {
            status = "suficiente";
            rotulo = "Dados suficientes para diagnóstico preliminar";
            orientacao = "A base de dados possui informações operacionais e financeiras adequadas para um diagnóstico estratégico de boa precisão preliminar.";
        } else if (score >= 4) {
            status = "parcial";
            rotulo = "Dados parcialmente completos";
            orientacao = "Alguns indicadores importantes estão ausentes ou desatualizados. As projeções têm alta sensibilidade às premissas adotadas.";
        } else {
            status = "insuficiente";
            rotulo = "Dados insuficientes para projeções financeiras";
            orientacao = "A ausência de métricas de faturamento e custos consolidados limita a análise a um diagnóstico qualitativo de posicionamento.";
        }

        return new DataQualityIndicator(
                status,
                rotulo,
                atendidos,
                faltantes,
                orientacao
        );
    }

    private BigDecimal compoundRevenue(BigDecimal base, double monthlyRate, int months) {
        double compounded = base.doubleValue() * Math.pow(1.0 + monthlyRate, months);
        if (compounded < 0) compounded = 0.0;
        return BigDecimal.valueOf(compounded).setScale(2, RoundingMode.HALF_UP);
    }

    private GrowthScenario buildScenario(String name, double rate, String rationale, BigDecimal revenue,
                                         BigDecimal expenses, BigDecimal startingCash) {
        BigDecimal revenue3 = compoundRevenue(revenue, rate, 3);
        BigDecimal revenue6 = compoundRevenue(revenue, rate, 6);
        BigDecimal revenue12 = compoundRevenue(revenue, rate, 12);
        return new GrowthScenario(
                name,
                String.format("%.1f%% ao mês; %s. Despesas mantidas em R$ %s/mês.", rate * 100, rationale, expenses),
                revenue3, revenue6, revenue12,
                revenue3.subtract(expenses), revenue6.subtract(expenses), revenue12.subtract(expenses),
                projectedCash(startingCash, revenue, expenses, rate, 3),
                projectedCash(startingCash, revenue, expenses, rate, 6),
                projectedCash(startingCash, revenue, expenses, rate, 12)
        );
    }

    private BigDecimal projectedCash(BigDecimal startingCash, BigDecimal revenue, BigDecimal expenses,
                                     double monthlyRate, int months) {
        BigDecimal cash = startingCash != null ? startingCash : BigDecimal.ZERO;
        for (int month = 1; month <= months; month++) {
            cash = cash.add(compoundRevenue(revenue, monthlyRate, month).subtract(expenses));
        }
        return cash.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
