package devPilot.backend.controllers;

import devPilot.backend.dto.GithubProfileResponse;
import devPilot.backend.dto.GithubRepoSummary;
import devPilot.backend.dto.UserResponse;
import devPilot.backend.exceptions.UnauthorizedException;
import devPilot.backend.security.AppUserPrinciple;
import devPilot.backend.security.CurrentUser;
import devPilot.backend.services.UserService;
import devPilot.backend.services.github.GithubApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {
    private final CurrentUser currentUser;
    private final GithubApiClient githubApiClient;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile() {
        AppUserPrinciple principal = currentUser.require();
        var user = principal.getUser();
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getGithubUsername(),
                user.getDisplayName(),
                user.getAvatarUrl()
        ));
    }

    @GetMapping("/github")
    public ResponseEntity<GithubProfileResponse> getGithubProfile() {
        AppUserPrinciple principal = currentUser.require();
        var user = principal.getUser();
            String accessToken = userService.decryptAccessToken(user);

        try {
            Map<String, Object> profile = githubApiClient.getUserProfile(accessToken);
            List<Map<String, Object>> rawRepos = githubApiClient.listRecentRepos(accessToken);
            List<GithubRepoSummary> recentRepos = rawRepos == null
                    ? List.of()
                    : rawRepos.stream().map(this::toRepoSummary).collect(Collectors.toList());

            GithubProfileResponse response = new GithubProfileResponse(
                    String.valueOf(profile.getOrDefault("login", "")),
                    asLong(profile.get("id")),
                                asString(profile.get("name")),
                                asString(profile.get("bio")),
                                asString(profile.get("company")),
                                asString(profile.get("location")),
                                asString(profile.get("blog")),
                                asString(profile.get("email")),
                                asString(profile.get("twitter_username")),
                    asInteger(profile.get("public_repos")),
                    asInteger(profile.get("followers")),
                    asInteger(profile.get("following")),
                    asInteger(profile.get("public_gists")),
                                asString(profile.get("created_at")),
                                asString(profile.get("updated_at")),
                                asString(profile.get("avatar_url")),
                                asString(profile.get("html_url")),
                    recentRepos
            );
            return ResponseEntity.ok(response);
        } catch (GithubApiClient.GithubApiException e) {
            log.error("GitHub API error: {}", e.getMessage());
            if (e.getStatusCode() == 401) {
                throw new devPilot.backend.exceptions.UnauthorizedException("GitHub access token expired. Please reconnect your GitHub account.");
            }
            throw e;
        }
    }

    private GithubRepoSummary toRepoSummary(Map<String, Object> repo) {
        return new GithubRepoSummary(
                asString(repo.get("name")),
                asString(repo.get("full_name")),
                asString(repo.get("description")),
                asString(repo.get("language")),
                asInteger(repo.get("stargazers_count")),
                asInteger(repo.get("forks_count")),
                asInteger(repo.get("open_issues_count")),
                asString(repo.get("html_url")),
                asString(repo.get("updated_at")),
                asBoolean(repo.get("private"))
        );
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return value == null ? null : Long.valueOf(String.valueOf(value));
    }

    private Integer asInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return value == null ? null : Integer.valueOf(String.valueOf(value));
    }

    private Boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return value == null ? null : Boolean.valueOf(String.valueOf(value));
    }

    private String asString(Object value) {
        if (value == null) return null;
        String str = String.valueOf(value);
        return "null".equals(str) ? null : str;
    }
}
