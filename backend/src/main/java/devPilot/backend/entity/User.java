package devPilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID uuid;

    @Column(name = "github_id", unique = true,nullable = false)
    private Long githubId;

    @Column(name = "github_username",nullable = false,length = 100)
    private String githubUsername;

    @Column(name = "display_name",nullable = false,length = 200)
    private String displayName;

    @Column(name = "avatar_url",length = 500)
    private String avatarUrl;
    @Column(name = "access_token",nullable = false,columnDefinition = "TEXT")
    private String accessToken;
    @Column(name = "token_scope",length = 500)
    private String tokenScope;
    @Column(updatable = false)
    private Instant createdAt;
    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return uuid;
    }

    public Long getGithubId() {
        return githubId;
    }

    public String getGithubUsername() {
        return githubUsername;
    }

    public void setGithubUsername(String githubUsername) {
        this.githubUsername = githubUsername;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenScope() {
        return tokenScope;
    }

    public void setTokenScope(String tokenScope) {
        this.tokenScope = tokenScope;
    }
}
