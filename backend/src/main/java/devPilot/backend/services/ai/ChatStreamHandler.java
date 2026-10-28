package devPilot.backend.services.ai;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    private final RagSettings ragSettings;

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

        // Pattern to extract thinking from model output (if model supports it)
    private static final Pattern THINKING_PATTERN = Pattern.compile("<thinking>(.*?)</thinking>", Pattern.DOTALL);
            // Pattern to extract partial thinking (opening tag found, waiting for closing)
            private static final Pattern THINKING_START_PATTERN = Pattern.compile("<thinking>(.*)", Pattern.DOTALL);

            public SseEmitter stream(
                    UUID sessionId,
                    ChatMessageResponse savedUserMessage,
                    List<CitationDto> citations,
                    String systemPrompt,
                    String userPrompt) {

                SseEmitter emitter = new SseEmitter(ragSettings.getStreamTimeoutMs());
                StringBuilder fullReply = new StringBuilder();
                AtomicReference<StringBuilder> thinkingBuffer = new AtomicReference<>(new StringBuilder());
                AtomicBoolean thinkingStarted = new AtomicBoolean(false);
                AtomicBoolean thinkingComplete = new AtomicBoolean(false);
                                AtomicReference<Integer> lastThinkingSentLength = new AtomicReference<>(0);

                                try {
                    emitter.send(SseEmitter.event()
                            .name("user_message")
                            .data(savedUserMessage));

                    // Sequential status updates for more natural feel
                    sendStatus(emitter, UNDERSTANDING_STATUSES[0]);
                    if (citations != null && !citations.isEmpty()) {
                        sendStatus(emitter, SEARCHING_STATUSES[0]);
                        sendStatus(emitter, RESEARCHING_STATUSES[0]);
                    }
                    // Don't send "Generating response..." - thinking will replace it
                    sendStatus(emitter, "Thinking…");

                    // Enhanced system prompt to encourage thinking output
                    String thinkingSystemPrompt = systemPrompt + """

                        IMPORTANT: You MUST show your step-by-step reasoning process.
                        Start your response with <thinking> and end your reasoning with </thinking>.
                        This reasoning will be displayed to the user as your thought process.
                        Be thorough - explain your understanding, what you're searching for, how you're analyzing the code, and how you're formulating the answer.
                        The thinking tags MUST appear at the very start of your response before any other content.
                        Example format:
                        <thinking>
                        First, I need to understand what the user is asking...
                        Then I'll search for relevant code...
                        Based on the context, I can see that...
                        </thinking>
                        Then provide your final answer.""";

                    ChatClient.builder(chatModel)
                            .build()
                            .prompt()
                            .system(thinkingSystemPrompt)
                            .user(userPrompt)
                            .stream()
                            .content()
                            .doOnNext(token -> {
                                fullReply.append(token);
                                StringBuilder buffer = thinkingBuffer.get();
                                buffer.append(token);

                                // Check for thinking start tag
                                if (!thinkingStarted.get() && buffer.toString().contains("<thinking>")) {
                                    thinkingStarted.set(true);
                                                                    lastThinkingSentLength.set(0); // Reset delta tracking
                                                                }

                                // Extract thinking content incrementally
                                if (thinkingStarted.get() && !thinkingComplete.get()) {
                                    // Try to find complete thinking block
                                    Matcher matcher = THINKING_PATTERN.matcher(buffer);
                                    if (matcher.find()) {
                                        String thinking = matcher.group(1).trim();
                                        if (!thinking.isEmpty()) {
                                            try {
                                                emitter.send(SseEmitter.event()
                                                        .name("thinking")
                                                        .data(thinking, MediaType.APPLICATION_JSON));
                                            } catch (Exception ex) {
                                                log.debug("Could not send thinking event", ex);
                                            }
                                        }
                                        thinkingComplete.set(true);
                                        buffer.setLength(0); // Clear buffer after thinking extracted
                                    } else {
                                                                        // Send partial thinking as it streams (after opening tag) - ONLY THE DELTA
                                        Matcher startMatcher = THINKING_START_PATTERN.matcher(buffer);
                                        if (startMatcher.find()) {
                                            String partialThinking = startMatcher.group(1);
                                                                            // Only send the delta since last send
                                                                            int lastSent = lastThinkingSentLength.get();
                                                                            if (partialThinking.length() > lastSent) {
                                                                                String delta = partialThinking.substring(lastSent);
                                                                                if (!delta.isBlank()) {
                                                                                    try {
                                                                                        emitter.send(SseEmitter.event()
                                                                                                .name("thinking")
                                                                                                .data(delta, MediaType.APPLICATION_JSON));
                                                                                    } catch (Exception ex) {
                                                                                        log.debug("Could not send partial thinking event", ex);
                                                                                    }
                                                                                }
                                                                                lastThinkingSentLength.set(partialThinking.length());
                                                                            }
                                                                        }
                                                                    }
                                                                }

                                // Only send token events after thinking is complete (or if no thinking tags)
                                if (thinkingComplete.get() || (!thinkingStarted.get() && !buffer.toString().contains("<thinking>"))) {
                                    try {
                                        emitter.send(SseEmitter.event()
                                                .name("token")
                                                .data(token, MediaType.APPLICATION_JSON));
                                    } catch (Exception ex) {
                                        throw new IllegalStateException(ex);
                                    }
                                }
                            })
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
            // Remove thinking tags from final stored content
            content = THINKING_PATTERN.matcher(content).replaceAll("").trim();

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
