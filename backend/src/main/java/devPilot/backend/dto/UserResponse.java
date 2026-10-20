package devPilot.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class UserResponse {
    private UUID id;
    private String githubUsername;
    private String displayName;
    private String avatarUrl;

    public UserResponse(UUID id, String githubUsername, String displayName, String avatarUrl) {
        this.id = id;
        this.githubUsername = githubUsername;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }
}
