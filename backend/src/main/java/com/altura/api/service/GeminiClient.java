package com.altura.api.service;

import com.altura.api.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {
    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    private static final String API_BASE =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private final String apiKey;
    private final String model;
    private final int timeoutSeconds;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiClient(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-3.5-flash-lite}") String model,
            @Value("${app.gemini.timeout-seconds:90}") int timeoutSeconds,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null && !model.isBlank() ? model.trim() : "gemini-3.5-flash-lite";
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 90;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public String generateStructuredAnalysis(String prompt) {
        if (!isConfigured()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O serviço de inteligência artificial está temporariamente indisponível " +
                    "(GEMINI_API_KEY não configurada no servidor)."
            );
        }

        // Tenta primeiro com JSON mode ativo; se o modelo não suportar (400), tenta sem.
        try {
            return callGemini(prompt, true);
        } catch (ApiException e) {
            // 400 pode indicar modelo sem suporte a responseMimeType=application/json
            if (e.status() == HttpStatus.BAD_REQUEST) {
                log.warn("JSON mode rejeitado pelo modelo {}. Tentando sem responseMimeType...", model);
                return callGemini(prompt, false);
            }
            throw e;
        }
    }

    private String callGemini(String prompt, boolean jsonMode) {
        String url = API_BASE + model + ":generateContent";

        try {
            Map<String, Object> generationConfig = new LinkedHashMap<>();
            generationConfig.put("maxOutputTokens", 4096);
            if (model.startsWith("gemini-3") || model.startsWith("gemini-4")) {
                String thinkingLevel = model.contains("flash-lite") ? "minimal" : "low";
                generationConfig.put("thinkingConfig", Map.of("thinkingLevel", thinkingLevel));
            }
            if (jsonMode) {
                generationConfig.put("responseMimeType", "application/json");
            }

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("role", "user",
                                   "parts", List.of(Map.of("text", prompt)))
                    ),
                    "generationConfig", generationConfig
            );

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-goog-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                // Tenta extrair a mensagem de erro do Gemini para log e resposta mais descritiva
                String geminiError = extractGeminiError(response.body());
                log.error("Erro HTTP {} ao chamar Gemini (modelo={}): {}",
                        response.statusCode(), model, geminiError);

                switch (response.statusCode()) {
                    case 400 -> throw new ApiException(HttpStatus.BAD_REQUEST,
                            "Requisição inválida para o provedor de IA: " + geminiError);
                    case 401, 403 -> throw new ApiException(HttpStatus.UNAUTHORIZED,
                            "Chave de API do Gemini inválida ou sem permissão. Verifique GEMINI_API_KEY no servidor.");
                    case 404 -> throw new ApiException(HttpStatus.BAD_GATEWAY,
                            "Modelo '" + model + "' não encontrado na API do Gemini. " +
                            "Verifique se o projeto da chave possui acesso ao modelo ou atualize GEMINI_MODEL para um modelo disponível.");
                    case 429 -> throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "Limite de requisições atingido no serviço de IA. Tente novamente em instantes.");
                    case 500, 503 -> throw new ApiException(HttpStatus.BAD_GATEWAY,
                            "O serviço Gemini está temporariamente indisponível. Tente novamente em alguns minutos.");
                    default -> throw new ApiException(HttpStatus.BAD_GATEWAY,
                            "Erro inesperado do provedor de IA (HTTP " + response.statusCode() + ").");
                }
            }

            return extractContent(response.body());

        } catch (ApiException e) {
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            log.error("Timeout na chamada ao Gemini ({}s): {}", timeoutSeconds, e.getMessage());
            throw new ApiException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "O provedor de IA não respondeu dentro de " + timeoutSeconds + " segundos. " +
                    "Tente novamente em instantes."
            );
        } catch (Exception e) {
            log.error("Exceção inesperada durante chamada ao Gemini: {}", e.getMessage(), e);
            throw new ApiException(
                    HttpStatus.BAD_GATEWAY,
                    "Erro de comunicação com o provedor de IA. Tente novamente em instantes."
            );
        }
    }

    /** Extrai o texto do primeiro candidate da resposta do Gemini. */
    private String extractContent(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        "Resposta vazia ou bloqueada pelo provedor de IA (sem candidatos).");
            }

            // Verificar finishReason — SAFETY bloqueia o conteúdo
            JsonNode finishReason = candidates.get(0).path("finishReason");
            if ("SAFETY".equals(finishReason.asText())) {
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        "O conteúdo foi bloqueado pelo filtro de segurança do provedor de IA. " +
                        "Revise os dados do nicho ou diferencial e tente novamente.");
            }

            JsonNode textNode = candidates.get(0)
                    .path("content").path("parts").get(0).path("text");
            if (textNode == null || textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        "Conteúdo vazio retornado pelo provedor de IA.");
            }

            String content = textNode.asText().trim();
            // Remove markdown code fences caso o modelo as adicione mesmo com JSON mode
            if (content.startsWith("```json")) content = content.substring(7);
            if (content.startsWith("```"))    content = content.substring(3);
            if (content.endsWith("```"))      content = content.substring(0, content.length() - 3);
            return content.trim();

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao parsear resposta do Gemini: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível processar a resposta do provedor de IA.");
        }
    }

    /** Tenta extrair a mensagem de erro do body de erro do Gemini. */
    private String extractGeminiError(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode msg = root.path("error").path("message");
            if (!msg.isMissingNode() && !msg.asText().isBlank()) {
                return msg.asText();
            }
        } catch (Exception ignored) { /* ignora falha no parse do erro */ }
        return body != null && body.length() > 300 ? body.substring(0, 300) + "..." : body;
    }

    public String getModel() {
        return model;
    }
}
