package devPilot.backend.security;

import devPilot.backend.entity.User;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AppUserPrinciple implements OAuth2User {
    private final User user;
    private final Map<String, Object> attributes;

    public AppUserPrinciple(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }


    public UUID getId() {
        return user.getId();
    }

    public User getUser() {
        return user;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return AuthorityUtils.createAuthorityList("ROLE_USER");
    }

    @Override
    public String getName() {
        return user.getId().toString();
    }
}
