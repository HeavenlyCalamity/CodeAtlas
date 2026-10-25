package devPilot.backend.repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import devPilot.backend.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);

    void deleteBySessionId(UUID sessionId);

    Optional<ChatMessage> findByIdAndSessionId(UUID id, UUID sessionId);
}