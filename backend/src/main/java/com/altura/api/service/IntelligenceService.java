package com.altura.api.service;

import com.altura.api.dto.IntelligenceDto.*;
import com.altura.api.dto.SegmentResponse;
import com.altura.api.dto.StartupProfileResponse;
import com.altura.api.exception.ApiException;
import com.altura.api.repository.AuthRepository;
import com.altura.api.repository.AuthRepository.AuthUser;
import com.altura.api.repository.IntelligenceRepository;
import com.altura.api.repository.ProfileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class IntelligenceService {
    private static final Logger log = LoggerFactory.getLogger(IntelligenceService.class);
    private static final Set<String> EVOLUCOES_VALIDAS = Set.of(
            "crescimento_consistente", "estavel", "oscilando", "em_queda", "nao_informado");
    private static final Set<String> PRIORIDADES_VALIDAS = Set.of(
            "acelerar_crescimento", "reduzir_custos", "captar_investimentos",
            "aquisicao_clientes", "retencao_clientes", "aumentar_rentabilidade");

    private final AuthRepository authRepository;
    private final ProfileRepository profileRepository;
    private final IntelligenceRepository intelligenceRepository;
    private final FinancialCalculator financialCalculator;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public IntelligenceService(
            AuthRepository authRepository,
            ProfileRepository profileRepository,
            IntelligenceRepository intelligenceRepository,
            FinancialCalculator financialCalculator,
            GeminiClient geminiClient,
            ObjectMapper objectMapper
    ) {
        this.authRepository = authRepository;
        this.profileRepository = profileRepository;
        this.intelligenceRepository = intelligenceRepository;
        this.financialCalculator = financialCalculator;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public IntelligenceContextResponse getContext(UUID userId) {
        requireStartup(userId);
        StartupProfileResponse profile = getStartupProfile(userId);

        Map<Long, String> segmentMap = loadSegmentMap();
        String segmentoPrincipal = segmentMap.getOrDefault(profile.segmentoId(), "Geral");
        List<String> segmentosSecundarios = profile.segmentosSecundarios() != null
                ? profile.segmentosSecundarios().stream().map(id -> segmentMap.getOrDefault(id, "Outro")).toList()
                : List.of();

        Optional<QuestionnaireData> ultimoQuestionario = intelligenceRepository.findQuestionnaire(userId);
        boolean temRelatorio = intelligenceRepository.hasReport(userId);
        String dataUltimo = intelligenceRepository.findLatestReportDate(userId);

        return new IntelligenceContextResponse(
                profile.nomeStartup(),
                profile.descricao(),
                segmentoPrincipal,
                segmentosSecundarios,
                profile.cidade(),
                profile.estado(),
                profile.dataFundacao(),
                profile.tracao() != null ? profile.tracao().receitaMensal() : null,
                profile.tracao() != null ? profile.tracao().mrr() : null,
                profile.tracao() != null ? profile.tracao().clientesAtivos() : null,
                profile.tracao() != null ? profile.tracao().pilotosAtivos() : null,
                profile.tracao() != null ? profile.tracao().crescimentoMensal() : null,
                profile.tracao() != null ? profile.tracao().evidenciaTracao() : null,
                profile.tracao() != null ? profile.tracao().mesReferencia() : null,
                profile.rodada() != null ? profile.rodada().valorAlvo() : null,
                profile.rodada() != null ? profile.rodada().valorCaptado() : null,
                ultimoQuestionario.orElse(null),
                temRelatorio,
                dataUltimo
        );
    }

    @Transactional(readOnly = true)
    public IntelligenceReportResponse getLatestReport(UUID userId) {
        requireStartup(userId);
        return intelligenceRepository.findLatestReport(userId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "Nenhum relatório de inteligência gerado ainda para esta startup."));
    }

    @Transactional
    public IntelligenceReportResponse generateAnalysis(UUID userId, QuestionnaireData questionnaire) {
        requireStartup(userId);
        validateQuestionnaire(questionnaire);

        // 1. Salvar ou atualizar as respostas do questionário
        intelligenceRepository.saveQuestionnaire(userId, questionnaire);

        // 2. Carregar dados cadastrais existentes
        StartupProfileResponse profile = getStartupProfile(userId);
        Map<Long, String> segmentMap = loadSegmentMap();
        String segmentoPrincipal = segmentMap.getOrDefault(profile.segmentoId(), "Geral");

        // 3. Cálculos determinísticos e avaliação de qualidade
        FinancialIndicators fi = financialCalculator.calculateFinancialIndicators(profile, questionnaire);
        GrowthProjections gp = financialCalculator.calculateProjections(profile, questionnaire, fi);
        DataQualityIndicator qi = financialCalculator.evaluateDataQuality(profile, questionnaire);

        // 4. Montar prompt com instruções estritas e sem alucinações
        String prompt = buildGeminiPrompt(profile, segmentoPrincipal, questionnaire, fi, gp, qi);

        // 5. Chamar Gemini para análise estratégica e qualitativa
        String rawJson = geminiClient.generateStructuredAnalysis(prompt);

        // 6. Validar estruturalmente a resposta da IA
        AiAnalysisParsed aiData = parseAndValidateAiResponse(rawJson);

        // 7. Montar o relatório completo integrando cálculos determinísticos + análise IA
        String dataGeracao = Instant.now().toString();
        IntelligenceReportResponse report = new IntelligenceReportResponse(
                0L,
                true,
                "Análise gerada por inteligência artificial em versão BETA. Resultados estimados, sujeitos a imprecisões.",
                "Esta ferramenta utiliza inteligência artificial para fornecer análises preliminares sobre o desempenho financeiro, crescimento e posicionamento de mercado da sua startup. Os resultados podem conter imprecisões e não possuem necessariamente o mesmo nível de profundidade ou confiabilidade de uma avaliação realizada por um consultor financeiro ou especialista de mercado. As informações apresentadas têm finalidade exclusivamente informativa e não constituem aconselhamento financeiro, contábil ou recomendação de investimento.",
                geminiClient.getModel(),
                dataGeracao,
                qi,
                fi,
                gp,
                aiData.visaoGeral(),
                aiData.inteligenciaCompetitiva(),
                aiData.recomendacoes(),
                questionnaire
        );

        // 8. Persistir e retornar
        return intelligenceRepository.saveReport(userId, report, questionnaire);
    }

    private void requireStartup(UUID userId) {
        AuthUser user = authRepository.findById(userId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        if (!user.active()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Usuário inativo.");
        }
        if (!"startup".equals(user.type())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "O Altura Intelligence está disponível exclusivamente para perfis de startups autorizadas.");
        }
    }

    private StartupProfileResponse getStartupProfile(UUID userId) {
        return profileRepository.findStartup(userId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "Perfil de startup não cadastrado. Complete o cadastro básico antes de gerar a análise."));
    }

    private Map<Long, String> loadSegmentMap() {
        Map<Long, String> map = new HashMap<>();
        for (SegmentResponse seg : profileRepository.listSegments()) {
            map.put(seg.id(), seg.nome());
        }
        return map;
    }

    private void validateQuestionnaire(QuestionnaireData q) {
        if (q == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O questionário complementar deve ser fornecido.");
        }
        if (q.despesaOperacionalMensal() == null || q.despesaOperacionalMensal().signum() < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A despesa operacional média mensal deve ser informada e maior ou igual a zero.");
        }
        if (q.caixaDisponivel() == null || q.caixaDisponivel().signum() < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O saldo disponível em caixa deve ser informado e maior ou igual a zero.");
        }
        if (!EVOLUCOES_VALIDAS.contains(q.evolucaoFaturamento())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecione uma evolução de faturamento válida.");
        }
        if (!PRIORIDADES_VALIDAS.contains(q.prioridadePrincipal())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecione uma prioridade estratégica válida.");
        }
        if (q.nichoEspecifico() == null || q.nichoEspecifico().trim().length() < 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O nicho específico de atuação deve ter pelo menos 3 caracteres.");
        }
        if (q.publicoAlvoRegiao() == null || q.publicoAlvoRegiao().trim().length() < 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O público-alvo e região devem ter pelo menos 3 caracteres.");
        }
    }

    private String buildGeminiPrompt(
            StartupProfileResponse profile,
            String segmentoPrincipal,
            QuestionnaireData q,
            FinancialIndicators fi,
            GrowthProjections gp,
            DataQualityIndicator qi
    ) {
        return """
                Você é o motor de inteligência analítica do Altura Intelligence (BETA), uma plataforma de venture capital e conexão de startups com investidores no Brasil.
                Sua tarefa é analisar criteriosamente os dados reais fornecidos da startup abaixo e produzir uma análise estratégica executiva, competitiva e de recomendações acionáveis.

                REGRAS OBRIGATÓRIAS DE RIGOR E INTEGRIDADE:
                1. NUNCA invente métricas, números de faturamento de concorrentes, fatias de mercado fictícias ou estatísticas não fornecidas.
                2. NUNCA invente concorrentes específicos com detalhes que você não possa verificar com certeza. Se não houver dados de fontes verificáveis no contexto, analise as categorias de concorrentes (diretos/indiretos) e indique explicitamente as limitações da análise preliminar.
                3. Respeite com precisão os cálculos determinísticos já efetuados pelo backend da plataforma (não recalcule nem contradiga os valores fornecidos).
                4. Esta ferramenta está em versão BETA. As análises devem ser maduras, objetivas, transparentes e contextualizadas para a prioridade principal da startup.
                5. A resposta DEVE ser estritamente em formato JSON válido, respeitando o schema exato descrito a seguir.
                6. Escreva para uma pessoa sem formação financeira: use linguagem simples e explique entre parênteses qualquer termo técnico inevitável na primeira vez em que aparecer.
                7. Seja conciso. Resumo executivo com no máximo 80 palavras; cada item de lista com no máximo 20 palavras; descrições de recomendações com no máximo 45 palavras; justificativas com no máximo 25 palavras.
                8. Destaque somente o que altera uma decisão. Evite repetir métricas que já aparecem nos dados e não use introduções genéricas.

                --- DADOS DA STARTUP ---
                Nome: %s
                Segmento Principal: %s
                Descrição da Proposta de Valor: %s
                Fundação: %s | Localização: %s/%s
                Receita Base Mensal Atual: R$ %s
                MRR: %s | Clientes Ativos: %s | Pilotos Ativos: %s
                Evidência de Tração Reportada: %s
                Despesa Operacional Mensal: R$ %s
                Caixa Disponível em Conta: R$ %s
                Saldo Operacional Simplificado: R$ %s (Net Burn Mensal Estimado: R$ %s)
                Runway Estimado: %s meses (Status: %s)
                Margem Bruta Informada: %s | CAC Estimado: %s | Churn Mensal: %s | Ticket Médio Estimado: %s
                Evolução do Faturamento nos Últimos 3 Meses: %s
                Prioridade Estratégica Principal: %s
                Nicho Específico: %s
                Público-alvo e Região: %s
                Diferencial Competitivo Declarado: %s
                Classificação da Qualidade dos Dados: %s (%s)

                --- SCHEMA JSON OBRIGATÓRIO DE RETORNO ---
                {
                  "visaoGeral": {
                    "resumoExecutivo": "string curta e simples sobre maturidade, tração, caixa e prioridade",
                    "pontosFortes": ["string", "string"],
                    "pontosAtencao": ["string", "string"],
                    "limitacoesDados": ["no máximo duas limitações realmente relevantes"]
                  },
                  "inteligenciaCompetitiva": {
                    "contextualizacaoNicho": "string com no máximo 60 palavras sobre o nicho",
                    "concorrentesIdentificados": ["no máximo três players notórios ou categorias gerais"],
                    "notaConcorrentesFontes": "string (declaração transparente: Análise preliminar baseada no nicho e segmento informados. Não foram aplicadas buscas externas adicionais.)",
                    "potenciaisVantagensCompetitivas": ["string", "string"],
                    "riscosMercado": ["string", "string"],
                    "oportunidadesPosicionamento": ["string", "string"]
                  },
                  "recomendacoes": [
                    {
                      "prioridade": "Alta prioridade",
                      "titulo": "string",
                      "descricao": "ação objetiva, em linguagem simples",
                      "justificativaEDados": "dados essenciais que sustentam a recomendação"
                    },
                    {
                      "prioridade": "Média prioridade",
                      "titulo": "string",
                      "descricao": "string detalhada",
                      "justificativaEDados": "string"
                    },
                    {
                      "prioridade": "Oportunidades futuras",
                      "titulo": "string",
                      "descricao": "string detalhada",
                      "justificativaEDados": "string"
                    }
                  ]
                }
                """.formatted(
                profile.nomeStartup(),
                segmentoPrincipal,
                profile.descricao(),
                profile.dataFundacao(),
                profile.cidade(), profile.estado(),
                fi.receitaBaseMensal(),
                profile.tracao() != null && profile.tracao().mrr() != null ? "R$ " + profile.tracao().mrr() : "Não informado",
                profile.tracao() != null && profile.tracao().clientesAtivos() != null ? profile.tracao().clientesAtivos() : "Não informado",
                profile.tracao() != null && profile.tracao().pilotosAtivos() != null ? profile.tracao().pilotosAtivos() : "Não informado",
                profile.tracao() != null ? profile.tracao().evidenciaTracao() : "Não informado",
                fi.despesaOperacionalMensal(),
                q.caixaDisponivel(),
                fi.saldoOperacionalSimplificado(),
                fi.consumoCaixaNetBurn(),
                fi.runwayMesesEstimado() != null ? fi.runwayMesesEstimado().toString() : "Operação sustentável / sem consumo de caixa",
                fi.statusRunway(),
                fi.margemBrutaPercentual() != null ? fi.margemBrutaPercentual() + "%" : "Não informado",
                fi.cacEstimado() != null ? "R$ " + fi.cacEstimado() : "Não informado",
                fi.churnMensalPercentual() != null ? fi.churnMensalPercentual() + "%" : "Não informado",
                fi.ticketMedioEstimado() != null ? "R$ " + fi.ticketMedioEstimado() : "Não calculável",
                q.evolucaoFaturamento(),
                q.prioridadePrincipal(),
                q.nichoEspecifico(),
                q.publicoAlvoRegiao(),
                q.diferencialCompetitivo() != null && !q.diferencialCompetitivo().isBlank() ? q.diferencialCompetitivo() : "Não especificado",
                qi.status(),
                qi.nivelRotulo()
        );
    }

    private record AiAnalysisParsed(
            ExecutiveOverview visaoGeral,
            CompetitiveIntelligence inteligenciaCompetitiva,
            List<StrategicRecommendation> recomendacoes
    ) {}

    private AiAnalysisParsed parseAndValidateAiResponse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);

            ExecutiveOverview vg = objectMapper.treeToValue(root.path("visaoGeral"), ExecutiveOverview.class);
            CompetitiveIntelligence ci = objectMapper.treeToValue(root.path("inteligenciaCompetitiva"), CompetitiveIntelligence.class);
            List<StrategicRecommendation> recs = objectMapper.readValue(
                    root.path("recomendacoes").toString(), new TypeReference<List<StrategicRecommendation>>() {});

            if (vg == null || vg.resumoExecutivo() == null || vg.resumoExecutivo().isBlank()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Visão geral incompleta na resposta da inteligência.");
            }
            if (ci == null || ci.contextualizacaoNicho() == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Análise competitiva incompleta na resposta da inteligência.");
            }
            if (recs == null || recs.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Recomendações estratégicas ausentes na resposta da inteligência.");
            }

            return new AiAnalysisParsed(vg, ci, recs);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao validar schema JSON retornado pelo Gemini: {}", e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "A resposta do provedor de inteligência artificial não atendeu ao schema esperado.");
        }
    }
}
