package devPilot.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class GithubProfileResponse {
    private String login;
    private Long id;
    private String name;
    private String bio;
    private String company;
    private String location;
    private String blog;
    private String email;
    private String twitterUsername;
    private Integer publicRepos;
    private Integer followers;
    private Integer following;
    private Integer publicGists;
    private String createdAt;
    private String updatedAt;
    private String avatarUrl;
    private String htmlUrl;
    private List<GithubRepoSummary> recentRepos;

    public GithubProfileResponse(String login, Long id, String name, String bio, String company,
                                 String location, String blog, String email, String twitterUsername,
                                 Integer publicRepos, Integer followers, Integer following,
                                 Integer publicGists, String createdAt, String updatedAt,
                                 String avatarUrl, String htmlUrl, List<GithubRepoSummary> recentRepos) {
        this.login = login;
        this.id = id;
        this.name = name;
        this.bio = bio;
        this.company = company;
        this.location = location;
        this.blog = blog;
        this.email = email;
        this.twitterUsername = twitterUsername;
        this.publicRepos = publicRepos;
        this.followers = followers;
        this.following = following;
        this.publicGists = publicGists;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.avatarUrl = avatarUrl;
        this.htmlUrl = htmlUrl;
        this.recentRepos = recentRepos;
    }
}
