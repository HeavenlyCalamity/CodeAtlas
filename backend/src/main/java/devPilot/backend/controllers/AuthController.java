package devPilot.backend.controllers;

import devPilot.backend.dto.UserResponse;
import devPilot.backend.entity.User;
import devPilot.backend.security.AppUserPrinciple;
import devPilot.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.netty.udp.UdpServer;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final CurrentUser currentUser;
    @GetMapping("/login-user")
    public Map<String, String> loginUrl() {
        return Map.of("url", "/oauth2/authorization/github");
    }
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        AppUserPrinciple principal = currentUser.require();
        User user = principal.getUser();
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getGithubUsername(),
                user.getDisplayName(),
                user.getAvatarUrl()));
    }
}
