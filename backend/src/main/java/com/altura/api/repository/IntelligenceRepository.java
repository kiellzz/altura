package com.altura.api.repository;

import com.altura.api.dto.IntelligenceDto.IntelligenceReportResponse;
import com.altura.api.dto.IntelligenceDto.QuestionnaireData;

import java.util.Optional;
import java.util.UUID;

public interface IntelligenceRepository {
    Optional<QuestionnaireData> findQuestionnaire(UUID userId);
    QuestionnaireData saveQuestionnaire(UUID userId, QuestionnaireData questionnaire);
    Optional<IntelligenceReportResponse> findLatestReport(UUID userId);
    IntelligenceReportResponse saveReport(UUID userId, IntelligenceReportResponse report, QuestionnaireData questionnaire);
    boolean hasReport(UUID userId);
    String findLatestReportDate(UUID userId);
}
