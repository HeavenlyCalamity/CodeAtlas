package devPilot.backend.services.ai;

import java.io.IOException;
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
    private static final String INTERRUPTED_SUFFIX =
            "\n\n[Response interrupted. This answer may be incomplete.]";

    private static final String[] UNDERSTANDING_STATUSES = {
        "Understanding the request...",
        "Analyzing your question...",
        "Processing the context...",
    };

    private static final String[] SEARCHING_STATUSES = {
        "Searching the repository...",
        "Finding relevant code...",
        "Scanning the codebase...",
        "Looking up references...",
    };

    private static final String[] RESEARCHING_STATUSES = {
        "Researching the source...",
        "Analyzing code patterns...",
        "Gathering context...",
    };

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;
    private final RagSettings ragSettings;

    public SseEmitter stream(
            UUID sessionId,
            ChatMessageResponse savedUserMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        SseEmitter emitter = new SseEmitter(ragSettings.getStreamTimeoutMs());
        StringBuilder fullReply = new StringBuilder();

        try {
            emitter.send(SseEmitter.event()
                    .name("user_message")
                    .data(savedUserMessage));

            sendStatus(emitter, UNDERSTANDING_STATUSES[0]);
            if (citations != null && !citations.isEmpty()) {
                sendStatus(emitter, SEARCHING_STATUSES[0]);
                sendStatus(emitter, RESEARCHING_STATUSES[0]);
            }
            sendStatus(emitter, "Generating response...");

            ChatClient.builder(chatModel)
                    .build()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .content()
                    .doOnNext(token -> {
                        fullReply.append(token);
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("token")
                                    .data(token, MediaType.APPLICATION_JSON));
                        } catch (Exception ex) {
                            throw new IllegalStateException("Could not write chat stream", ex);
                        }
                    })
                    .subscribe(
                            ignored -> { },
                            error -> handleStreamError(emitter, sessionId, fullReply, citations, error),
                            () -> completeStream(emitter, sessionId, fullReply, citations));
        } catch (Exception ex) {
            handleStreamError(emitter, sessionId, fullReply, citations, ex);
        }

        return emitter;
    }

    private void sendStatus(SseEmitter emitter, String status) throws IOException {
        emitter.send(SseEmitter.event()
                .name("status")
                .data(status, MediaType.APPLICATION_JSON));
    }

    private void handleStreamError(
            SseEmitter emitter,
            UUID sessionId,
            StringBuilder fullReply,
            List<CitationDto> citations,
            Throwable error) {
        log.error("Chat stream error", error);

        try {
            String partialContent = fullReply.toString().trim();
            if (!partialContent.isEmpty()) {
                ChatMessage incompleteAssistant = saveAssistantMessage(
                        sessionId,
                        partialContent + INTERRUPTED_SUFFIX,
                        citations);
                emitter.send(SseEmitter.event()
                        .name("assistant_message")
                        .data(toMessageResponse(incompleteAssistant)));
            }

            sendErrorEvent(emitter, error);
        } catch (Exception persistenceOrDeliveryError) {
            log.error("Could not persist or deliver the interrupted chat response",
                    persistenceOrDeliveryError);
            sendErrorEvent(emitter, error);
        } finally {
            // The SSE error event has already been sent. Completing normally prevents
            // Spring MVC from trying to write a second, incompatible HTTP error response.
            emitter.complete();
        }
    }

    private void completeStream(
            SseEmitter emitter,
            UUID sessionId,
            StringBuilder fullReply,
            List<CitationDto> citations) {
        try {
            String content = fullReply.toString().trim();
            if (content.isEmpty()) {
                sendErrorEvent(emitter,
                        new IllegalStateException("The model returned an empty response."));
                return;
            }

            ChatMessage assistant = saveAssistantMessage(sessionId, content, citations);
            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));
            emitter.send(SseEmitter.event().name("done").data("ok"));
        } catch (Exception ex) {
            log.error("Could not persist or deliver the completed chat response", ex);
            sendErrorEvent(emitter, ex);
        } finally {
            emitter.complete();
        }
    }

    private ChatMessage saveAssistantMessage(
            UUID sessionId, String content, List<CitationDto> citations) {
        return chatMessageRepository.save(ChatMessage.builder()
                .sessionId(sessionId)
                .role(MessageRole.ASSISTANT)
                .content(content)
                .citations(citationMapper.toJson(citations == null ? List.of() : citations))
                .build());
    }

    private void sendErrorEvent(SseEmitter emitter, Throwable error) {
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(safeError(error), MediaType.APPLICATION_JSON));
        } catch (Exception sendError) {
            log.debug("Could not send chat stream error event", sendError);
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
        String normalized = message.toLowerCase();
        if (normalized.contains("api key") || normalized.contains("authorization")) {
            return "The AI request failed. Check the server model configuration.";
        }
        return "The AI response was interrupted. Any partial response has been saved as incomplete.";
    }
}
