package devPilot.backend.services.github;

import devPilot.backend.dto.IndexStatusResponse;
import devPilot.backend.dto.RepositoryResponse;
import devPilot.backend.entity.IndexStatus;
import devPilot.backend.entity.Repository;
import devPilot.backend.entity.User;
import devPilot.backend.exceptions.BadRequestException;
import devPilot.backend.exceptions.NotFoundException;
import devPilot.backend.repository.RepositoryRepository;
import devPilot.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RepoService {
    private final RepositoryRepository repositoryRepository;
    private final UserService userService;
    private final GithubApiClient githubApiClient;

    @Transactional
    public List<RepositoryResponse> syncAndListRepo(UUID userId) {
        User user = userService.requiredById(userId);
        String token = userService.decryptAccessToken(user);
        List<Map<String, Object>> remoteRepos = githubApiClient.listUserRepos(token);
        List<Repository> saved = new ArrayList<>();
        for (Map<String, Object> remote : remoteRepos) {
            Long githubRepoId = toLong(remote.get("id"));
            Repository repo = repositoryRepository
                    .findByUserIdAndGithubRepoId(userId, githubRepoId)
                    .orElseGet(Repository::new);

            String fullName = String.valueOf(remote.get("full_name"));
            String[] parts = fullName.split("/", 2);

            repo.setUserId(userId);
            repo.setGithubRepoId(githubRepoId);
            repo.setOwner(parts.length > 0 ? parts[0] : String.valueOf(remote.get("owner")));
            repo.setName(parts.length > 1 ? parts[1] : String.valueOf(remote.get("name")));
            repo.setFullName(fullName);
            repo.setPrivate(Boolean.TRUE.equals(remote.get("private")));
            repo.setDefaultBranch(remote.get("default_branch") != null ? String.valueOf(remote.get("default_branch")) : "main");
            repo.setLanguage(remote.get("language") != null ? String.valueOf(remote.get("language")) : null);
            repo.setHtmlUrl(remote.get("html_url") != null ? String.valueOf(remote.get("html_url")) : null);
            repo.setDescription(remote.get("description") != null ? String.valueOf(remote.get("description")) : null);
            repo.setUpdatedAt(Instant.now());
            if (repo.getOwner() == null || repo.getOwner().isBlank()) {
                Object ownerObj = remote.get("owner");
                if (ownerObj instanceof Map<?, ?> ownerMap && ownerMap.get("login") != null) {
                    repo.setOwner(String.valueOf(ownerMap.get("login")));
                }
            }
            saved.add(repositoryRepository.save(repo));
        }
        return saved.stream().sorted((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName())).map(this::toResponse).toList();
    }

    @Transactional
    public RepositoryResponse importFromUrl(UUID userId, String repositoryUrl) {
        String[] parts = parseGithubUrl(repositoryUrl);
        User user = userService.requiredById(userId);
        Map<String, Object> remote = githubApiClient.getRepository(
                userService.decryptAccessToken(user), parts[0], parts[1]);

        Long githubRepoId = toLong(remote.get("id"));
        Repository repo = repositoryRepository
                .findByUserIdAndGithubRepoId(userId, githubRepoId)
                .orElseGet(Repository::new);
        String fullName = String.valueOf(remote.get("full_name"));
        repo.setUserId(userId);
        repo.setGithubRepoId(githubRepoId);
        repo.setOwner(parts[0]);
        repo.setName(parts[1]);
        repo.setFullName(fullName);
        repo.setPrivate(Boolean.TRUE.equals(remote.get("private")));
        repo.setDefaultBranch(remote.get("default_branch") != null
                ? String.valueOf(remote.get("default_branch")) : "main");
        repo.setLanguage(remote.get("language") != null ? String.valueOf(remote.get("language")) : null);
        repo.setHtmlUrl(remote.get("html_url") != null ? String.valueOf(remote.get("html_url")) : repositoryUrl);
        repo.setDescription(remote.get("description") != null ? String.valueOf(remote.get("description")) : null);
        repo.setUpdatedAt(Instant.now());
        return toResponse(repositoryRepository.save(repo));
    }

    private static String[] parseGithubUrl(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Paste a GitHub repository URL");
        }
        try {
            URI uri = new URI(value.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || !"github.com".equalsIgnoreCase(uri.getHost())) {
                throw new BadRequestException("Use a URL like https://github.com/owner/repository");
            }
            String path = uri.getPath();
            if (path == null) {
                throw new BadRequestException("Use a URL like https://github.com/owner/repository");
            }
            String[] parts = path.replaceAll("^/|/$", "").split("/");
            if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
                throw new BadRequestException("Use a URL like https://github.com/owner/repository");
            }
            String repo = parts[1].endsWith(".git")
                    ? parts[1].substring(0, parts[1].length() - 4) : parts[1];
            if (repo.isBlank()) {
                throw new BadRequestException("Use a URL like https://github.com/owner/repository");
            }
            return new String[]{parts[0], repo};
        } catch (URISyntaxException ex) {
            throw new BadRequestException("Enter a valid GitHub repository URL");
        }
    }

    private static Long toLong(Object value) {
        if ((value instanceof Number number)) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponse> listStored(UUID userId) {
        return repositoryRepository.findByUserIdOrderByFullNameAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Repository requireOwned(UUID repoId, UUID userId) {
        return repositoryRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(()-> new NotFoundException("Repository not found") );
    }

    @Transactional(readOnly = true)
    public IndexStatusResponse status(UUID repoId, UUID userId) {
        Repository repo = requireOwned(repoId, userId);
        return new IndexStatusResponse(repo.getId(),
        repo.getIndexStatus(),
        repo.getFilesTotal(),
        repo.getFilesProcessed(),
        repo.getChunkCount(),
        repo.getIndexedAt(),
        repo.getErrorMessage());

    }

    @Transactional(noRollbackFor = RuntimeException.class)
    public void startIndexing(UUID repoId, UUID userId) {
        Repository repo = requireOwned(repoId, userId);
        User user = userService.requiredById(userId);
        repo.setIndexStatus(IndexStatus.INDEXING);
        repo.setErrorMessage(null);
        repo.setFilesProcessed(0);
        repo.setChunkCount(0);
        repositoryRepository.save(repo);

        try {
            Map<String, Object> treeResponse = githubApiClient.getRepoTree(
                    userService.decryptAccessToken(user),
                    repo.getOwner(),
                    repo.getName(),
                    repo.getDefaultBranch());
            Object treeValue = treeResponse == null ? null : treeResponse.get("tree");
            int files = 0;
            if (treeValue instanceof List<?> tree) {
                for (Object entry : tree) {
                    if (entry instanceof Map<?, ?> item && "blob".equals(item.get("type"))) {
                        files++;
                    }
                }
            }
            repo.setFilesTotal(files);
            repo.setFilesProcessed(files);
            repo.setIndexStatus(IndexStatus.READY);
            repo.setIndexedAt(Instant.now());
        } catch (RuntimeException ex) {
            repo.setIndexStatus(IndexStatus.FAILED);
            repo.setErrorMessage(ex.getMessage() == null ? "Repository indexing failed" : ex.getMessage());
            throw ex;
        } finally {
            repositoryRepository.save(repo);
        }
    }

    public RepositoryResponse toResponse(Repository repo) {
        return new RepositoryResponse(
                repo.getId(),
                repo.getGithubRepoId(),
                repo.getOwner(),
                repo.getName(),
                repo.getFullName(),
                repo.isPrivate(),
                repo.getDefaultBranch(),
                repo.getLanguage(),
                repo.getHtmlUrl(),
                repo.getDescription(),
                repo.getIndexStatus(),
                repo.getIndexedAt(),
                repo.getChunkCount(),
                repo.getFilesTotal(),
                repo.getFilesProcessed(),
                repo.getErrorMessage()
        );
    }
}
