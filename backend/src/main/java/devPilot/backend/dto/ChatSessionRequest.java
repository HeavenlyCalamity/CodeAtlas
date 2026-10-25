package devPilot.backend.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ChatSessionRequest(
        @NotNull UUID repositoryId,
        String title) {
}