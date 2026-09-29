package com.careerlens.backend.security;

import com.careerlens.backend.entity.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final String issuer;
    private final long expirationMinutes;

    public JwtTokenService(
            ObjectMapper objectMapper,
            @Value("${app.auth.jwt.secret}") String secret,
            @Value("${app.auth.jwt.issuer:careerlens}") String issuer,
            @Value("${app.auth.jwt.expiration-minutes:480}") long expirationMinutes
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.issuer = issuer;
        this.expirationMinutes = expirationMinutes;
    }

    public TokenIssue issue(User user, String role) {
        long now = Instant.now().getEpochSecond();
        long expiresAt = now + expirationMinutes * 60;
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iss", issuer);
        payload.put("sub", String.valueOf(user.getId()));
        payload.put("uid", user.getId());
        payload.put("login_id", user.getLoginId());
        payload.put("role", role);
        payload.put("iat", now);
        payload.put("exp", expiresAt);

        String unsigned = encodeJson(header) + "." + encodeJson(payload);
        String signature = sign(unsigned);
        return new TokenIssue(unsigned + "." + signature, expiresAt);
    }

    public JwtClaims verify(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("JWT token is blank.");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("JWT token is malformed.");
        }
        String unsigned = parts[0] + "." + parts[1];
        String expectedSignature = sign(unsigned);
        if (!constantTimeEquals(expectedSignature, parts[2])) {
            throw new IllegalArgumentException("JWT signature is invalid.");
        }
        JsonNode payload = decodeJson(parts[1]);
        if (!issuer.equals(payload.path("iss").asText(""))) {
            throw new IllegalArgumentException("JWT issuer is invalid.");
        }
        long expiresAt = payload.path("exp").asLong(0);
        if (expiresAt <= Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("JWT token is expired.");
        }
        long userId = payload.path("uid").asLong(0);
        String loginId = payload.path("login_id").asText("");
        String role = payload.path("role").asText("USER");
        if (userId <= 0 || loginId.isBlank()) {
            throw new IllegalArgumentException("JWT claims are incomplete.");
        }
        return new JwtClaims(userId, loginId, role, expiresAt);
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JWT claims.", exception);
        }
    }

    private JsonNode decodeJson(String value) {
        try {
            return objectMapper.readTree(URL_DECODER.decode(value));
        } catch (Exception exception) {
            throw new IllegalArgumentException("JWT payload is invalid.", exception);
        }
    }

    private String sign(String unsignedToken) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            return URL_ENCODER.encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign JWT.", exception);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length != actualBytes.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < expectedBytes.length; i++) {
            result |= expectedBytes[i] ^ actualBytes[i];
        }
        return result == 0;
    }

    public record TokenIssue(String accessToken, Long expiresAt) {
    }
}
