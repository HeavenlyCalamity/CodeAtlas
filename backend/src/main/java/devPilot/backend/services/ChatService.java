package devPilot.backend.services;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import devPilot.backend.dto.ChatMessageResponse;
import devPilot.backend.dto.ChatSessionRenameRequest;
import devPilot.backend.dto.ChatSessionRequest;
import devPilot.backend.dto.ChatSessionResponse;
import devPilot.backend.entity.ChatMessage;
import devPilot.backend.entity.ChatSession;
import devPilot.backend.entity.IndexStatus;
import devPilot.backend.entity.MessageRole;
import devPilot.backend.entity.Repository;
import devPilot.backend.exceptions.BadRequestException;
import devPilot.backend.exceptions.NotFoundException;
import devPilot.backend.repository.ChatMessageRepository;
import devPilot.backend.repository.ChatSessionRepository;
import devPilot.backend.repository.RepositoryRepository;
import devPilot.backend.services.ai.ChatPromptBuilder;
import devPilot.backend.services.ai.ChatStreamHandler;
import devPilot.backend.services.ai.CitationMapper;
import devPilot.backend.services.ai.CodeContextRetriever;
import devPilot.backend.services.ai.RetrievedContext;
import devPilot.backend.services.github.RepoService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RepositoryRepository repositoryRepository;
    private final RepoService repoService;
    private final CodeContextRetriever codeContextRetriever;
    private final ChatPromptBuilder chatPromptBuilder;
    private final ChatStreamHandler chatStreamHandler;
    private final CitationMapper citationMapper;

    @Transactional
    public ChatSessionResponse createSession(UUID userId, ChatSessionRequest request) {
        Repository repo = requireReadyRepository(request.repositoryId(), userId);
        String title = request.title() != null && !request.title().isBlank()
                ? request.title().trim()
                    : repo.getName();
        ChatSession session = ChatSession.builder()
                .userId(userId)
                .repositoryId(repo.getId())
                .title(title)
                .build();
        session = chatSessionRepository.save(session);
        return toSessionResponse(session, repo.getName());
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(UUID userId, UUID repositoryId) {
        repoService.requireOwned(repositoryId, userId);
        return chatSessionRepository
                .findByUserIdAndRepositoryIdOrderByCreatedAtDesc(userId, repositoryId)
                .stream()
                .map(session -> toSessionResponse(session, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listAllSessions(UUID userId) {
        Map<UUID, String> repositoryNames = repositoryRepository.findByUserIdOrderByFullNameAsc(userId)
                .stream()
                .collect(Collectors.toMap(Repository::getId, Repository::getName));
        return chatSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(session -> toSessionResponse(session, repositoryNames.get(session.getRepositoryId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID userId, UUID sessionId) {
        ChatSession session = requireSession(userId, sessionId);
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId()).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public ChatSessionResponse renameSession(
            UUID userId, UUID sessionId, ChatSessionRenameRequest request) {
        ChatSession session = requireSession(userId, sessionId);
        session.setTitle(request.title().trim());
        return toSessionResponse(chatSessionRepository.save(session), userId);
    }

    @Transactional
    public void deleteSession(UUID userId, UUID sessionId) {
        ChatSession session = requireSession(userId, sessionId);
        chatMessageRepository.deleteBySessionId(session.getId());
        chatSessionRepository.delete(session);
    }

    public SseEmitter streamReply(UUID userId, UUID sessionId, String userContent) {
        ChatSession session = requireSession(userId, sessionId);
        Repository repo = requireReadyRepository(session.getRepositoryId(), userId);
        List<ChatMessage> previousMessages = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId());
        ChatMessage userMessage = chatMessageRepository.save(ChatMessage.builder()
                .sessionId(session.getId())
                .role(MessageRole.USER)
                .content(userContent)
                .citations("[]")
                .build());
        maybeTitleFromFirstMessage(session, previousMessages, userContent);
        return startStream(session, repo, previousMessages, userMessage, userContent);
    }

    @Transactional
    public SseEmitter resubmitMessage(UUID userId, UUID sessionId, UUID messageId, String content) {
        ChatSession session = requireSession(userId, sessionId);
        Repository repo = requireReadyRepository(session.getRepositoryId(), userId);
        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId());
        ChatMessage userMessage = messages.stream()
                .filter(message -> message.getId().equals(messageId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Chat message not found"));
        if (userMessage.getRole() != MessageRole.USER) {
            throw new BadRequestException("Only user messages can be edited");
        }
        deleteMessagesAfter(messages, userMessage);
        userMessage.setContent(content.trim());
        userMessage = chatMessageRepository.save(userMessage);
        ChatMessage savedUserMessage = userMessage;
        List<ChatMessage> history = messages.stream()
                .takeWhile(message -> !message.getId().equals(savedUserMessage.getId()))
                .toList();
        maybeTitleFromFirstMessage(session, history, savedUserMessage.getContent());
        return startStream(session, repo, history, savedUserMessage, savedUserMessage.getContent());
    }

    public SseEmitter regenerateLastReply(UUID userId, UUID sessionId) {
        ChatSession session = requireSession(userId, sessionId);
        Repository repo = requireReadyRepository(session.getRepositoryId(), userId);
        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId());
        ChatMessage lastUser = null;
        for (int index = messages.size() - 1; index >= 0; index--) {
            if (messages.get(index).getRole() == MessageRole.USER) {
                lastUser = messages.get(index);
                break;
            }
        }
        if (lastUser == null) {
            throw new BadRequestException("There is no user message to regenerate from");
        }
        ChatMessage lastUserMessage = lastUser;
        deleteMessagesAfter(messages, lastUserMessage);
        List<ChatMessage> history = messages.stream()
                .takeWhile(message -> !message.getId().equals(lastUserMessage.getId()))
                .toList();
        return startStream(session, repo, history, lastUserMessage, lastUserMessage.getContent());
    }

    public ChatSession requireSession(UUID userId, UUID sessionId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new NotFoundException("Chat session not found"));
    }

    private SseEmitter startStream(
            ChatSession session,
            Repository repo,
            List<ChatMessage> previousMessages,
            ChatMessage userMessage,
            String userContent) {
        RetrievedContext retrievedContext = isConversational(userContent)
                ? new RetrievedContext(List.of(), "")
                : codeContextRetriever.retrieve(repo.getId(), userContent);
        String systemPrompt = chatPromptBuilder.systemPrompt(repo.getFullName());
        String userPrompt = chatPromptBuilder.userPrompt(
                conversationHistory(previousMessages),
                retrievedContext.contextText().isBlank()
                        ? "(no matching code chunks found)"
                        : retrievedContext.contextText(),
                userContent);
        return chatStreamHandler.stream(
                session.getId(),
                toMessageResponse(userMessage),
                retrievedContext.citations(),
                systemPrompt,
                userPrompt);
    }

    private void deleteMessagesAfter(List<ChatMessage> messages, ChatMessage pivot) {
        boolean after = false;
        for (ChatMessage message : messages) {
            if (after) {
                chatMessageRepository.delete(message);
            }
            if (message.getId().equals(pivot.getId())) {
                after = true;
            }
        }
        chatMessageRepository.flush();
    }

    private void maybeTitleFromFirstMessage(
                ChatSession session, List<ChatMessage> previousMessages, String content) {
            if (!previousMessages.isEmpty()) {
                return;
            }
            if (session.getTitle() != null
                    && !session.getTitle().isBlank()
                    && !"New chat".equals(session.getTitle())) {
                return;
            }
            String compact = content.trim().replaceAll("\\s+", " ");
            session.setTitle(compact.length() > 72 ? compact.substring(0, 72).trim() + "…" : compact);
            chatSessionRepository.save(session);
        }

    private Repository requireReadyRepository(UUID repositoryId, UUID userId) {
        Repository repo = repoService.requireOwned(repositoryId, userId);
        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository must be indexed before chatting");
        }
        return repo;
    }

    private boolean isConversational(String content) {
        String normalized = content.trim().toLowerCase();
        return normalized.matches("^(hi|hello|hey|hiya|good morning|good afternoon|good evening)[!.?, ]*$")
                || normalized.matches("^(thanks|thank you|ok|okay|cool|great)[!.?, ]*$");
    }

    private String conversationHistory(List<ChatMessage> messages) {
        if (messages.isEmpty()) {
            return "(no previous messages)";
        }
        return messages.stream()
                .skip(Math.max(0, messages.size() - 24))
                .map(message -> {
                    String role = message.getRole() == MessageRole.ASSISTANT
                            ? "ASSISTANT (previous reply)"
                            : "USER";
                    return role + ":\n" + message.getContent();
                })
                .collect(Collectors.joining("\n"));
    }

    private ChatSessionResponse toSessionResponse(ChatSession session, UUID userId) {
        Repository repository = repoService.requireOwned(session.getRepositoryId(), userId);
        return toSessionResponse(session, repository.getName());
    }

    private ChatSessionResponse toSessionResponse(ChatSession session, String repositoryName) {
        return new ChatSessionResponse(
                session.getId(),
                session.getRepositoryId(),
                repositoryName == null || repositoryName.isBlank()
                        ? "Repository"
                        : repositoryName,
                session.getTitle(),
                session.getCreatedAt());
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }
}
