package devPilot.backend.services.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import devPilot.backend.dto.ChatMessageResponse;
import devPilot.backend.dto.CitationDto;
import devPilot.backend.entity.ChatMessage;
import devPilot.backend.entity.MessageRole;
import devPilot.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {
    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;

    public SseEmitter stream(
            UUID sessionId,
            ChatMessageResponse savedUserMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        SseEmitter emitter = new SseEmitter(RagSettings.STREAM_TIMEOUT_MS);
        StringBuilder fullReply = new StringBuilder();

        try {
            emitter.send(SseEmitter.event()
                    .name("user_message")
                    .data(savedUserMessage));
            sendStatus(emitter, "Preparing response...");
            if (citations != null && !citations.isEmpty()) {
                sendStatus(emitter, "Searching repository...");
            }
            sendStatus(emitter, "Generating response...");

            ChatClient.builder(chatModel)
                    .build()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .content()
                    .doOnNext(token -> appendToken(emitter, fullReply, token))
                    .doOnError(err -> {
                        log.error("Chat stream error", err);
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("error")
                                    .data(safeError(err), MediaType.APPLICATION_JSON));
                        } catch (Exception sendError) {
                            log.debug("Could not send chat stream error", sendError);
                        }
                        emitter.completeWithError(err);
                    })
                    .doOnComplete(() -> completeStream(emitter, sessionId, fullReply, citations))
                    .subscribe();
        } catch (Exception ex) {
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(safeError(ex), MediaType.APPLICATION_JSON));
            } catch (Exception ignored) {
                // Emitter already failed.
            }
            emitter.completeWithError(ex);
        }
        return emitter;
    }

    private void appendToken(SseEmitter emitter, StringBuilder fullReply, String token) {
        fullReply.append(token);
        try {
            emitter.send(SseEmitter.event()
                    .name("token")
                    .data(token, MediaType.APPLICATION_JSON));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void sendStatus(SseEmitter emitter, String status) throws java.io.IOException {
        emitter.send(SseEmitter.event()
                .name("status")
                .data(status, MediaType.APPLICATION_JSON));
    }

    private void completeStream(
            SseEmitter emitter,
            UUID sessionId,
            StringBuilder fullReply,
            List<CitationDto> citations) {
        try {
            String content = fullReply.toString().trim();
            if (content.isEmpty()) {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("The model returned an empty response.", MediaType.APPLICATION_JSON));
                emitter.complete();
                return;
            }
            ChatMessage assistant = chatMessageRepository.save(ChatMessage.builder()
                    .sessionId(sessionId)
                    .role(MessageRole.ASSISTANT)
                    .content(content)
                    .citations(citationMapper.toJson(citations == null ? List.of() : citations))
                    .build());

            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));
            emitter.send(SseEmitter.event().name("done").data("ok"));
            emitter.complete();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }

    private static String safeError(Throwable error) {
        String message = error.getMessage();
        if (message == null || message.isBlank()) {
            return "The AI response could not be generated.";
        }
        if (message.toLowerCase().contains("api key") || message.toLowerCase().contains("authorization")) {
            return "The AI request failed. Check the server model configuration.";
        }
        return "The AI response could not be generated.";
    }
}
