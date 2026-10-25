package devPilot.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatSessionResponse(
        UUID id,
        UUID repositoryId,
        String repositoryName,
        String title,
        Instant createdAt) {
}
