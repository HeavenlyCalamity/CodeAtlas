package devPilot.backend.services.github;


import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;


@Component
public class GithubRateLimiter {

    private final Long delayMs;

    public GithubRateLimiter(@Value("${github.rate-limit-delay-ms:50}") Long delayMs) {
        this.delayMs = Math.max(0,delayMs); // 1 second delay
    }

    public void pause(){
        if(delayMs<=0){
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Thread interrupted during Github API rate limiting pause", e);
            }
        }
    }
}
