package devPilot.backend.repository;

import devPilot.backend.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    List<ChatSession> findByUserIdAndRepositoryIdOrderByCreatedAtDesc(UUID userId, UUID
            repositoryId);

    List<ChatSession> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<ChatSession> findByIdAndUserId(UUID id, UUID userId);
}