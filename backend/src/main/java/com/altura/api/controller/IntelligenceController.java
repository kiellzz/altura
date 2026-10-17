package com.altura.api.controller;

import com.altura.api.dto.IntelligenceDto.IntelligenceContextResponse;
import com.altura.api.dto.IntelligenceDto.IntelligenceReportResponse;
import com.altura.api.dto.IntelligenceDto.QuestionnaireData;
import com.altura.api.service.IntelligenceService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/intelligence")
public class IntelligenceController {

    private final IntelligenceService service;

    public IntelligenceController(IntelligenceService service) {
        this.service = service;
    }

    @GetMapping("/context")
    public IntelligenceContextResponse getContext(@AuthenticationPrincipal Jwt jwt) {
        return service.getContext(subject(jwt));
    }

    @GetMapping("/report")
    public IntelligenceReportResponse getLatestReport(@AuthenticationPrincipal Jwt jwt) {
        return service.getLatestReport(subject(jwt));
    }

    @PostMapping("/analyze")
    public IntelligenceReportResponse generateAnalysis(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody QuestionnaireData request
    ) {
        return service.generateAnalysis(subject(jwt), request);
    }

    private UUID subject(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
