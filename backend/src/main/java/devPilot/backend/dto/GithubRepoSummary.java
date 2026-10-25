package devPilot.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GithubRepoSummary {
    private String name;
    private String fullName;
    private String description;
    private String language;
    private Integer stargazersCount;
    private Integer forksCount;
    private Integer openIssuesCount;
    private String htmlUrl;
    private String updatedAt;
    private Boolean isPrivate;

    public GithubRepoSummary(String name, String fullName, String description, String language,
                             Integer stargazersCount, Integer forksCount, Integer openIssuesCount,
                             String htmlUrl, String updatedAt, Boolean isPrivate) {
        this.name = name;
        this.fullName = fullName;
        this.description = description;
        this.language = language;
        this.stargazersCount = stargazersCount;
        this.forksCount = forksCount;
        this.openIssuesCount = openIssuesCount;
        this.htmlUrl = htmlUrl;
        this.updatedAt = updatedAt;
        this.isPrivate = isPrivate;
    }
}
