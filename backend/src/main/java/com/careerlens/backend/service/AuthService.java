package com.careerlens.backend.service;

import com.careerlens.backend.dto.AccountUpdateRequestDto;
import com.careerlens.backend.dto.AuthResponseDto;
import com.careerlens.backend.dto.AvailabilityResponseDto;
import com.careerlens.backend.dto.LoginRequestDto;
import com.careerlens.backend.dto.PasswordChangeRequestDto;
import com.careerlens.backend.dto.SignupRequestDto;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.security.JwtTokenService;
import com.careerlens.backend.security.JwtTokenService.TokenIssue;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String SUSPENDED_STATUS = "SUSPENDED";
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final JwtTokenService jwtTokenService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Set<String> adminLoginIds;

    public AuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            JwtTokenService jwtTokenService,
            @Value("${app.auth.admin-login-ids:admin,careerlens-admin}") String adminLoginIds
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.jwtTokenService = jwtTokenService;
        this.adminLoginIds = Arrays.stream(adminLoginIds.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public AvailabilityResponseDto checkLoginIdAvailability(String value) {
        String loginId = normalizeIdentifier(value);
        boolean available = !loginId.isBlank() && !userRepository.existsByLoginId(loginId);
        return new AvailabilityResponseDto(
                "login_id",
                loginId,
                available,
                available ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다."
        );
    }

    @Transactional(readOnly = true)
    public AvailabilityResponseDto checkEmailAvailability(String value) {
        String email = normalizeIdentifier(value);
        boolean available = !email.isBlank() && !userRepository.existsByEmail(email);
        return new AvailabilityResponseDto(
                "email",
                email,
                available,
                available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다."
        );
    }

    @Transactional
    public AuthResponseDto signup(SignupRequestDto request) {
        String loginId = normalizeIdentifier(request.loginId());
        String email = normalizeIdentifier(request.email());
        String displayName = request.displayName().trim();

        if (!request.password().equals(request.passwordConfirm())) {
            throw new IllegalArgumentException("비밀번호 확인이 일치하지 않습니다.");
        }
        validatePasswordPolicy(request.password());

        if (userRepository.existsByLoginId(loginId)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setLoginId(loginId);
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setCountryDialCode(blankToNull(request.countryDialCode()));
        user.setPhoneNumber(blankToNull(request.phoneNumber()));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(roleFor(loginId));
        user.setAccountStatus(ACTIVE_STATUS);
        user.setEmailVerified(false);
        user.setFailedLoginAttempts(0);
        user.setMarketingOptIn(Boolean.TRUE.equals(request.marketingOptIn()));
        user.setTermsAcceptedAt(now);
        user.setPrivacyAcceptedAt(now);
        user.setSecurityNoticeAcceptedAt(now);
        user.setPasswordChangedAt(now);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional
    public AuthResponseDto login(LoginRequestDto request) {
        String loginIdentifier = normalizeIdentifier(request.loginId());
        User user = userRepository.findByLoginId(loginIdentifier)
                .or(() -> userRepository.findByEmail(loginIdentifier))
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        ensureLoginAllowed(user);
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedLogin(user);
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String role = roleFor(user.getLoginId());
        if (user.getRole() == null || user.getRole().isBlank() || "ADMIN".equals(role)) {
            user.setRole(role);
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponseDto currentUser(JwtClaims claims) {
        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return toResponse(user);
    }

    @Transactional
    public AuthResponseDto updateCurrentUser(JwtClaims claims, AccountUpdateRequestDto request) {
        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String displayName = request.displayName() == null ? "" : request.displayName().trim();
        String email = normalizeIdentifier(request.email());
        if (displayName.isBlank()) {
            throw new IllegalArgumentException("이름을 입력해주세요.");
        }
        if (email.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        userRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
                });

        boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setCountryDialCode(blankToNull(request.countryDialCode()));
        user.setPhoneNumber(blankToNull(request.phoneNumber()));
        user.setMarketingOptIn(Boolean.TRUE.equals(request.marketingOptIn()));
        if (emailChanged) {
            user.setEmailVerified(false);
        }
        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(user);
    }

    @Transactional
    public AuthResponseDto changePassword(JwtClaims claims, PasswordChangeRequestDto request) {
        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        if (!request.newPassword().equals(request.newPasswordConfirm())) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 새 비밀번호를 입력해주세요.");
        }
        validatePasswordPolicy(request.newPassword());

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(user);
    }

    private void ensureLoginAllowed(User user) {
        String status = user.getAccountStatus() == null || user.getAccountStatus().isBlank()
                ? ACTIVE_STATUS
                : user.getAccountStatus();
        if (SUSPENDED_STATUS.equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("정지된 계정입니다. 관리자에게 문의해주세요.");
        }

        LocalDateTime lockedUntil = user.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("로그인 실패가 반복되어 계정이 일시 잠겼습니다. 잠시 후 다시 시도해주세요.");
        }
        if (lockedUntil != null && lockedUntil.isBefore(LocalDateTime.now())) {
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }
    }

    private void registerFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();
        attempts += 1;
        user.setFailedLoginAttempts(attempts);
        user.setUpdatedAt(LocalDateTime.now());
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        }
    }

    private AuthResponseDto toResponse(User user) {
        String role = normalizedRole(user);
        TokenIssue token = jwtTokenService.issue(user, role);
        return new AuthResponseDto(
                user.getId(),
                user.getLoginId(),
                user.getDisplayName(),
                user.getEmail(),
                role,
                "ADMIN".equals(role),
                userProfileRepository.findByUserId(user.getId()).isPresent(),
                user.getAccountStatus() == null ? ACTIVE_STATUS : user.getAccountStatus(),
                Boolean.TRUE.equals(user.getEmailVerified()),
                user.getLastLoginAt(),
                token.accessToken(),
                "Bearer",
                token.expiresAt(),
                user.getCountryDialCode(),
                user.getPhoneNumber(),
                Boolean.TRUE.equals(user.getMarketingOptIn())
        );
    }

    private String roleFor(String loginId) {
        String normalizedLoginId = loginId == null ? "" : loginId.trim().toLowerCase(Locale.ROOT);
        return adminLoginIds.contains(normalizedLoginId) ? "ADMIN" : "USER";
    }

    private String normalizedRole(User user) {
        if (user.getRole() == null || user.getRole().isBlank()) {
            return roleFor(user.getLoginId());
        }
        return user.getRole().trim().toUpperCase(Locale.ROOT);
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        }
        if (!password.matches(".*[A-Za-z].*")
                || !password.matches(".*\\d.*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeIdentifier(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
