package devPilot.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import devPilot.backend.dto.ChatMessageEditRequest;
import devPilot.backend.dto.ChatMessageRequest;
import devPilot.backend.dto.ChatMessageResponse;
import devPilot.backend.dto.ChatSessionRenameRequest;
import devPilot.backend.dto.ChatSessionRequest;
import devPilot.backend.dto.ChatSessionResponse;
import devPilot.backend.security.CurrentUser;
import devPilot.backend.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private final CurrentUser currentUser;
    private final ChatService chatService;

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionResponse> createSession(
            @Valid @RequestBody ChatSessionRequest request) {
        UUID userId = currentUser.require().getId();
        return ResponseEntity.ok(chatService.createSession(userId, request));
    }

    @GetMapping("/sessions")
    public List<ChatSessionResponse> listSessions(@RequestParam UUID repositoryId) {
        UUID userId = currentUser.require().getId();
        return chatService.listSessions(userId, repositoryId);
    }

    @GetMapping("/sessions/all")
    public List<ChatSessionResponse> listAllSessions() {
        return chatService.listAllSessions(currentUser.require().getId());
    }

    @GetMapping("/sessions/{id}")
    public List<ChatMessageResponse> getMessages(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        return chatService.getMessages(userId, id);
    }

    @PatchMapping("/sessions/{id}")
    public ChatSessionResponse renameSession(
            @PathVariable UUID id,
            @Valid @RequestBody ChatSessionRenameRequest request) {
        return chatService.renameSession(currentUser.require().getId(), id, request);
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        chatService.deleteSession(currentUser.require().getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/sessions/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody ChatMessageRequest request) {
        UUID userId = currentUser.require().getId();
        return chatService.streamReply(userId, id, request.content());
    }

    @PostMapping(
            value = "/sessions/{sessionId}/messages/{messageId}/resubmit",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter resubmitMessage(
            @PathVariable UUID sessionId,
            @PathVariable UUID messageId,
            @Valid @RequestBody ChatMessageEditRequest request) {
        return chatService.resubmitMessage(
                currentUser.require().getId(), sessionId, messageId, request.content());
    }

    @PostMapping(value = "/sessions/{id}/regenerate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter regenerate(@PathVariable UUID id) {
        return chatService.regenerateLastReply(currentUser.require().getId(), id);
    }
}
