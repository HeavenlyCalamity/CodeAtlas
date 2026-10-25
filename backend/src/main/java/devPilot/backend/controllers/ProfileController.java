package devPilot.backend.controllers;

import devPilot.backend.dto.GithubProfileResponse;
import devPilot.backend.dto.GithubRepoSummary;
import devPilot.backend.dto.UserResponse;
import devPilot.backend.security.AppUserPrinciple;
import devPilot.backend.security.CurrentUser;
import devPilot.backend.services.github.GithubApiClient;
import lombok.RequiredArgsConstructor;
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
public class ProfileController {
    private final CurrentUser currentUser;
    private final GithubApiClient githubApiClient;

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
        String accessToken = user.getAccessToken();

        Map<String, Object> profile = githubApiClient.getUserProfile(accessToken);
        List<Map<String, Object>> rawRepos = githubApiClient.listRecentRepos(accessToken);
        List<GithubRepoSummary> recentRepos = rawRepos == null
                ? List.of()
                : rawRepos.stream().map(this::toRepoSummary).collect(Collectors.toList());

        GithubProfileResponse response = new GithubProfileResponse(
                String.valueOf(profile.getOrDefault("login", "")),
                asLong(profile.get("id")),
                String.valueOf(profile.getOrDefault("name", "")),
                String.valueOf(profile.getOrDefault("bio", "")),
                String.valueOf(profile.getOrDefault("company", "")),
                String.valueOf(profile.getOrDefault("location", "")),
                String.valueOf(profile.getOrDefault("blog", "")),
                String.valueOf(profile.getOrDefault("email", "")),
                String.valueOf(profile.getOrDefault("twitter_username", "")),
                asInteger(profile.get("public_repos")),
                asInteger(profile.get("followers")),
                asInteger(profile.get("following")),
                asInteger(profile.get("public_gists")),
                String.valueOf(profile.getOrDefault("created_at", "")),
                String.valueOf(profile.getOrDefault("updated_at", "")),
                String.valueOf(profile.getOrDefault("avatar_url", "")),
                String.valueOf(profile.getOrDefault("html_url", "")),
                recentRepos
        );
        return ResponseEntity.ok(response);
    }

    private GithubRepoSummary toRepoSummary(Map<String, Object> repo) {
        return new GithubRepoSummary(
                String.valueOf(repo.getOrDefault("name", "")),
                String.valueOf(repo.getOrDefault("full_name", "")),
                String.valueOf(repo.getOrDefault("description", "")),
                String.valueOf(repo.getOrDefault("language", "")),
                asInteger(repo.get("stargazers_count")),
                asInteger(repo.get("forks_count")),
                asInteger(repo.get("open_issues_count")),
                String.valueOf(repo.getOrDefault("html_url", "")),
                String.valueOf(repo.getOrDefault("updated_at", "")),
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
}
