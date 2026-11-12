package com.remont.back_end.security; 

import com.remont.back_end.model.User;
import com.remont.back_end.model.Employee;
import com.remont.back_end.model.Client;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Implementação personalizada de UserDetails (spring security) para incluir o ID do usuário.
 */

public class UserPrincipal implements UserDetails {

    private Long id;
    private String email;
    private String password;
    private boolean enabled = true;
    private Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.enabled = (!(user instanceof Employee employee) || employee.isActive())
                && (!(user instanceof Client client) || client.isActive());
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()));
    }

    public UserPrincipal(Long id, String email, String role) {
        this.id = id;
        this.email = email;
        this.password = null; 
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
    }

    public Long getId() {
        return id;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return enabled; }
}