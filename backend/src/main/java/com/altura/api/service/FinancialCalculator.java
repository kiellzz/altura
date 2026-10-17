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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

        BigDecimal churn = q.churnMensalPercentual();
        BigDecimal retencaoAnual = churn != null
                ? BigDecimal.valueOf(Math.pow(1 - churn.doubleValue() / 100, 12) * 100).setScale(2, RoundingMode.HALF_UP)
                : null;
        BigDecimal renovacaoInformada = extractRenewal(profile);
        String alertaRetencao = null;
        if (churn != null && renovacaoInformada != null && retencaoAnual.subtract(renovacaoInformada).abs().compareTo(BigDecimal.valueOf(5)) > 0) {
            alertaRetencao = "Churn mensal convertido em retenção anual diverge da renovação informada em mais de 5 p.p.; valide se medem clientes ou contratos.";
        } else if (churn != null) {
            alertaRetencao = churn.compareTo(BigDecimal.ONE) < 0 ? "Churn excelente para SaaS B2B de PMEs." : churn.compareTo(BigDecimal.valueOf(3)) <= 0 ? "Churn aceitável para SaaS B2B de PMEs." : "Churn requer atenção para SaaS B2B de PMEs.";
        }

        BigDecimal payback = null;
        BigDecimal ltv = null;
        BigDecimal ltvCac = null;
        String unitAlert = null;
        if (ticketMedio != null && margemBruta != null && q.cacEstimado() != null && churn != null && margemBruta.signum() > 0 && churn.signum() > 0) {
            BigDecimal margem = margemBruta.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
            payback = q.cacEstimado().divide(ticketMedio.multiply(margem), 2, RoundingMode.HALF_UP);
            ltv = ticketMedio.multiply(margem).divide(churn.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP), 2, RoundingMode.HALF_UP);
            if (q.cacEstimado().signum() > 0) ltvCac = ltv.divide(q.cacEstimado(), 2, RoundingMode.HALF_UP);
            if ((ltvCac != null && ltvCac.compareTo(BigDecimal.TEN) > 0) || payback.compareTo(BigDecimal.valueOf(3)) < 0) {
                unitAlert = "Valores atípicos: valide CAC, churn e margem bruta antes de tomar decisões.";
            }
        }

        String formulas = "Saldo Operacional Simplificado = Receita Base Mensal (R$ " + receitaBase + ") - Despesa Mensal Informada (R$ " + despesas + "). " +
                "Consumo Líquido (Net Burn) considera as receitas como compensação operacional. " +
                "Runway = Saldo em Caixa (R$ " + caixa + ") / Consumo Líquido Mensal. " +
                "Ticket Médio = Receita Base / Clientes Ativos. Payback estimado = CAC / (Ticket Médio × Margem Bruta). LTV estimado = (Ticket Médio × Margem Bruta) / Churn Mensal. " +
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
                retencaoAnual,
                renovacaoInformada,
                alertaRetencao,
                payback,
                ltv,
                ltvCac,
                unitAlert,
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

        Double historicalRate = null;
        if (profile.tracao() != null && profile.tracao().crescimentoMensal() != null) {
            double hist = profile.tracao().crescimentoMensal().doubleValue() / 100.0;
            if (hist >= -0.20 && hist <= 0.30) {
                historicalRate = hist;
            }
        }

        if (historicalRate == null) {
            return new GrowthProjections(false,
                    "Não há taxa histórica confiável nem tendência recente suficiente para simular crescimento quantitativo.",
                    List.of(), "Informe a evolução recente ou atualize a taxa de crescimento mensal para habilitar cenários.");
        }

        double baseMonthlyRate = historicalRate;
        double spread = Math.max(0.005, Math.abs(baseMonthlyRate) * 0.5);
        double rateConservador = baseMonthlyRate >= 0 ? baseMonthlyRate * 0.5 : baseMonthlyRate * 1.5;
        double rateBase = baseMonthlyRate;
        double rateOtimista = baseMonthlyRate >= 0 ? baseMonthlyRate * 1.5 : baseMonthlyRate * 0.5;

        List<GrowthScenario> cenarios = new ArrayList<>();

        cenarios.add(buildScenario("Conservador", rateConservador,
                "usa aproximadamente 50% da taxa histórica para absorver fricções e ciclo de vendas",
                profile, q, fi, receitaBase));

        cenarios.add(buildScenario("Base", rateBase,
                "replica a taxa histórica informada, calibrada pela observação real da tração",
                profile, q, fi, receitaBase));

        cenarios.add(buildScenario("Otimista", rateOtimista,
                "simula aceleração de 50% sobre a taxa histórica, mantendo as demais premissas",
                profile, q, fi, receitaBase));

        BigDecimal receitaFinalBase = cenarios.get(1).receitaProjetada12m();
        String aviso = "Despesa mensal = despesa base + (novos clientes + reposição do churn) × CAC + receita × (1 − margem bruta) + investimento opcional em marketing/vendas. " +
                "A taxa Base replica o histórico informado; a razão receita final/receita atual está exibida no cartão do cenário.";
        if (receitaFinalBase.compareTo(receitaBase.multiply(BigDecimal.valueOf(2))) > 0) aviso += " Aviso: o crescimento Base é agressivo (acima de 2x em 12 meses).";

        return new GrowthProjections(
                true,
                "Simulações condicionais baseadas exclusivamente na taxa histórica mensal informada, com cenários Conservador < Base < Otimista.",
                cenarios,
                aviso + " Não é orçamento nem previsão garantida."
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
            if (profile.tracao().pilotosAtivos() != null && profile.tracao().pilotosAtivos() > 0) {
                faltantes.add("Conversão dos pilotos em clientes pagantes");
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
            rotulo = "Alta confiabilidade";
            orientacao = "A base de dados possui informações operacionais e financeiras adequadas para um diagnóstico estratégico de boa precisão preliminar.";
        } else if (score >= 4) {
            status = "parcial";
            rotulo = "Média confiabilidade";
            orientacao = "Alguns indicadores importantes estão ausentes ou desatualizados. As projeções têm alta sensibilidade às premissas adotadas.";
        } else {
            status = "insuficiente";
            rotulo = "Baixa confiabilidade";
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

    private GrowthScenario buildScenario(String name, double rate, String rationale, StartupProfileResponse profile,
                                         QuestionnaireData q, FinancialIndicators fi, BigDecimal revenue) {
        BigDecimal revenue3 = compoundRevenue(revenue, rate, 3);
        BigDecimal revenue6 = compoundRevenue(revenue, rate, 6);
        BigDecimal revenue12 = compoundRevenue(revenue, rate, 12);
        BigDecimal currentClients = profile.tracao() != null && profile.tracao().clientesAtivos() != null
                ? BigDecimal.valueOf(profile.tracao().clientesAtivos()) : BigDecimal.ZERO;
        BigDecimal churn = q.churnMensalPercentual() != null ? q.churnMensalPercentual().divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal margin = q.margemBrutaPercentual() != null ? q.margemBrutaPercentual().divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP) : BigDecimal.ONE;
        BigDecimal marketing = q.investimentoMarketingVendasMensal() != null ? q.investimentoMarketingVendasMensal() : BigDecimal.ZERO;
        BigDecimal[] expenses = projectedExpenses(profile, q, revenue, rate, currentClients, churn, margin, marketing, 12);
        BigDecimal finalExpense = expenses[11];
        return new GrowthScenario(
                name,
                rationale,
                revenue3, revenue6, revenue12,
                revenue3.subtract(expenses[2]), revenue6.subtract(expenses[5]), revenue12.subtract(expenses[11]),
                projectedCash(q.caixaDisponivel(), revenue, rate, expenses, 3),
                projectedCash(q.caixaDisponivel(), revenue, rate, expenses, 6),
                projectedCash(q.caixaDisponivel(), revenue, rate, expenses, 12),
                BigDecimal.valueOf(rate * 100).setScale(2, RoundingMode.HALF_UP),
                q.churnMensalPercentual(), q.cacEstimado(), finalExpense,
                revenue12.divide(revenue, 2, RoundingMode.HALF_UP)
        );
    }

    private BigDecimal[] projectedExpenses(StartupProfileResponse profile, QuestionnaireData q, BigDecimal revenue, double monthlyRate,
                                           BigDecimal clients, BigDecimal churn, BigDecimal margin, BigDecimal marketing, int months) {
        BigDecimal[] result = new BigDecimal[months];
        BigDecimal previousClients = clients;
        for (int month = 1; month <= months; month++) {
            BigDecimal monthRevenue = compoundRevenue(revenue, monthlyRate, month);
            BigDecimal churned = previousClients.multiply(churn);
            BigDecimal newGrowthClients = previousClients.multiply(BigDecimal.valueOf(Math.max(monthlyRate, 0)));
            BigDecimal acquisition = churned.add(newGrowthClients);
            BigDecimal cacCost = q.cacEstimado() != null ? acquisition.multiply(q.cacEstimado()) : BigDecimal.ZERO;
            BigDecimal variableCost = monthRevenue.multiply(BigDecimal.ONE.subtract(margin));
            result[month - 1] = q.despesaOperacionalMensal().add(marketing).add(cacCost).add(variableCost).setScale(2, RoundingMode.HALF_UP);
            previousClients = previousClients.subtract(churned).add(newGrowthClients);
        }
        return result;
    }

    private BigDecimal projectedCash(BigDecimal startingCash, BigDecimal revenue, double monthlyRate, BigDecimal[] expenses, int months) {
        BigDecimal cash = startingCash != null ? startingCash : BigDecimal.ZERO;
        for (int month = 1; month <= months; month++) {
            cash = cash.add(compoundRevenue(revenue, monthlyRate, month).subtract(expenses[month - 1]));
        }
        return cash.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal extractRenewal(StartupProfileResponse profile) {
        String evidence = profile.tracao() != null ? profile.tracao().evidenciaTracao() : null;
        if (evidence == null) return null;
        Matcher matcher = Pattern.compile("(?i)(?:renova(?:ção|cao)|reten(?:ção|cao)).{0,20}?(\\d+(?:[,.]\\d+)?)\\s*%").matcher(evidence);
        if (!matcher.find()) return null;
        return new BigDecimal(matcher.group(1).replace(',', '.')).setScale(2, RoundingMode.HALF_UP);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
