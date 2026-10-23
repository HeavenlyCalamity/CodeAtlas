package devPilot.backend.entity;

import io.micrometer.core.annotation.Counted;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Builder
@Entity
@Table(name = "repositories", uniqueConstraints = @UniqueConstraint(
        name = "uk_repositories_user_github_repo",
        columnNames = {"user_id", "github_repo_id"}))
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Repository {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id",nullable = false)
    private UUID userId;

    @Column(name = "github_repo_id", nullable = false)
    private Long githubRepoId;

    @Column(nullable = false,length = 100)
    private String owner;

    @Column(nullable = false,length = 200)
    private String name;

    @Column(name = "full_name",nullable = false,length = 200)
    private String fullName;

    @Column(name = "is_private",nullable = false)
    private boolean isPrivate;

    @Column(name = "default_branch",nullable = false,length = 100)
    private String defaultBranch;

    @Column(length = 100)
    private String language;

    @Column(name = "html_url",length = 500)
    private String htmlUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "index_status",nullable = false,length =20)
    @Builder.Default
    private IndexStatus indexStatus=IndexStatus.PENDING;

    @Column(name = "indexed_at")
    private Instant indexedAt;

    @Column(name = "chunk_count",nullable = false)
    private int chunkCount=0;

    @Column(name = "files_total",nullable = false)
    private int filesTotal=0;
    @Column(name = "files_processed",nullable = false)
    private int filesProcessed = 0;

    @Column(name = "error_message",columnDefinition = "TEXT")
    private String errorMessage;
    @Column(name = "created_at",nullable = false,updatable = false)
    private  Instant createdAt;
    @Column(name = "updated_at",nullable = false)
    private Instant updatedAt;
    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
        if (indexStatus == null) {
            indexStatus = IndexStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

}
