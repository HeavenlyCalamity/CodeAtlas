package devPilot.backend.services.github;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GithubApiClient {
    private static final String API_BASE = "https://api.github.com/";
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};

    public List<Map<String, Object>> listUserRepos(String accessToken) {
        List<Map<String, Object>> all = new ArrayList<>();
        int page = 1;
        while (page <= 10) {
            final int currentPage = page;
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
                    .body(LIST_MAP);
            if (pageRepos == null || pageRepos.isEmpty()) {
                break;
            }
            all.addAll(pageRepos);
            if (pageRepos.size() < 100) {
                break;
            }
            page++;
        }
        return all;
    }

    public Map<String, Object> getRepoTree(String accessToken, String owner, String repo, String branch) {
        return client(accessToken)
                .get()
                .uri("/repos/{owner}/{repo}/git/trees/{branch}?recursive=1", owner, repo, branch)
                .retrieve()
                .body(MAP);
    }

    public String getFileContent(String accessToken, String owner, String repo, String path) {
        Map<String, Object> body = client(accessToken)
                .get()
                .uri(uriBuilder -> uriBuilder
                        .path("/repos/{owner}/{repo}/contents/")
                        .path(path)
                        .build(owner, repo))
                .retrieve()
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
}
