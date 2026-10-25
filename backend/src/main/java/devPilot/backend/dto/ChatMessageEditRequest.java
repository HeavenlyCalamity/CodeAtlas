package devPilot.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageEditRequest(
        @NotBlank @Size(max = 12000) String content) {}
