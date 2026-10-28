package devPilot.backend.services.github;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GithubApiClient {
    private static final String API_BASE = "https://api.github.com/";
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};

    public List<Map<String, Object>> listUserRepos(String accessToken) {
        List<Map<String, Object>> all = new ArrayList<>();
        int page = 1;
        while (page <= 10) {
            final int currentPage = page;
            try {
                List<Map<String, Object>> pageRepos = client(accessToken)
                        .get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/user/repos")
                                .queryParam("affiliation", "owner, collaborator, organization")
                                .queryParam("sort", "updated")
                                .queryParam("per_page", 100)
                                .queryParam("page", currentPage)
                                .build())
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, (request, response) -> {
                            throw new GithubApiException(response.getStatusCode().value(), "GitHub API error: " + response.getStatusText());
                        })
                        .body(LIST_MAP);
                if (pageRepos == null || pageRepos.isEmpty()) {
                    break;
                }
                all.addAll(pageRepos);
                if (pageRepos.size() < 100) {
                    break;
                }
                page++;
            } catch (RestClientException e) {
                log.error("Failed to list user repos on page {}", currentPage, e);
                throw new GithubApiException("Failed to fetch repositories: " + e.getMessage());
            }
        }
        return all;
    }

    public Map<String, Object> getUserProfile(String accessToken) {
        try {
            return client(accessToken)
                    .get()
                    .uri("/user")
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        throw new GithubApiException(response.getStatusCode().value(), "GitHub API error: " + response.getStatusText());
                    })
                    .body(MAP);
        } catch (RestClientException e) {
            log.error("Failed to get user profile", e);
            throw new GithubApiException("Failed to fetch user profile: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> listRecentRepos(String accessToken) {
        try {
            return client(accessToken)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/user/repos")
                            .queryParam("sort", "updated")
                            .queryParam("direction", "desc")
                            .queryParam("per_page", 6)
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        throw new GithubApiException(response.getStatusCode().value(), "GitHub API error: " + response.getStatusText());
                    })
                    .body(LIST_MAP);
        } catch (RestClientException e) {
            log.error("Failed to list recent repos", e);
            throw new GithubApiException("Failed to fetch recent repositories: " + e.getMessage());
        }
    }

    public Map<String, Object> getRepository(String accessToken, String owner, String repo) {
        try {
            return client(accessToken)
                    .get()
                    .uri("/repos/{owner}/{repo}", owner, repo)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        throw new GithubApiException(response.getStatusCode().value(), "GitHub API error: " + response.getStatusText());
                    })
                    .body(MAP);
        } catch (RestClientException e) {
            log.error("Failed to get repository {}/{}", owner, repo, e);
            throw new GithubApiException("Failed to fetch repository: " + e.getMessage());
        }
    }

    public Map<String, Object> getRepoTree(String accessToken, String owner, String repo, String branch) {
        try {
            return client(accessToken)
                    .get()
                    .uri("/repos/{owner}/{repo}/git/trees/{branch}?recursive=1", owner, repo, branch)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        throw new GithubApiException(response.getStatusCode().value(), "GitHub API error: " + response.getStatusText());
                    })
                    .body(MAP);
        } catch (RestClientException e) {
            log.error("Failed to get repo tree for {}/{}", owner, repo, e);
            throw new GithubApiException("Failed to fetch repository tree: " + e.getMessage());
        }
    }

    public String getFileContent(String accessToken, String owner, String repo, String path, String branch) {
        try {
            Map<String, Object> body = client(accessToken)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/repos/{owner}/{repo}/contents/")
                            .path(path)
                            .queryParam("ref", branch)
                            .build(owner, repo))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        throw new GithubApiException(response.getStatusCode().value(), "GitHub API error: " + response.getStatusText());
                    })
                    .body(MAP);
            if (body == null) {
                return null;
            }

            Object encoding = body.get("encoding");
            Object content = body.get("content");
            if (content == null) {
                return null;
            }

            if ("base64".equals(String.valueOf(encoding))) {
                String raw = String.valueOf(content).replaceAll("\\s", "");
                return new String(Base64.getDecoder().decode(raw), StandardCharsets.UTF_8);
            }

            return String.valueOf(content);
        } catch (RestClientException e) {
            log.error("Failed to get file content for {}/{}/{}", owner, repo, path, e);
            throw new GithubApiException("Failed to fetch file content: " + e.getMessage());
        }
    }

    private final RestClient.Builder restClientBuilder;
    private RestClient client(String accessToken) {
        return restClientBuilder
                .baseUrl(API_BASE)
                .defaultHeader("Authorization", "Bearer " + accessToken)
                .defaultHeader("Accept", "application/vnd.github.v3+json")
                .defaultHeader("X-Github-Api-Version", "2022-11-28")
                .defaultHeader("USER_AGENT", "DevPilot")
                .build();
    }

    public static class GithubApiException extends RuntimeException {
        private final int statusCode;

        public GithubApiException(int statusCode, String message) {
            super(message);
            this.statusCode = statusCode;
        }

        public GithubApiException(String message) {
            super(message);
            this.statusCode = 0;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }
}
