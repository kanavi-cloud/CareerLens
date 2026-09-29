package com.careerlens.backend.service;

import com.careerlens.backend.dto.KakaoPayReadyResponseDto;
import com.careerlens.backend.entity.PaymentOrder;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.exception.PaymentGatewayException;
import com.careerlens.backend.repository.PaymentOrderRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.security.JwtClaims;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KakaoPayService {

    private static final String PROVIDER_KAKAOPAY = "KAKAOPAY";
    private static final String STATUS_READY = "READY";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_CANCELED = "CANCELED";
    private static final String STATUS_FAILED = "FAILED";
    private static final String PRO_ITEM_NAME = "CareerLens Pro 30일 패스";
    private static final int PRO_PRICE = 4900;
    private static final int QUANTITY = 1;
    private static final int TAX_FREE_AMOUNT = 0;
    private static final int READY_EXPIRATION_MINUTES = 20;
    private static final int HTTP_TIMEOUT_SECONDS = 15;

    private final PaymentOrderRepository paymentOrderRepository;
    private final UserRepository userRepository;
    private final MembershipService membershipService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String secretKey;
    private final String cid;
    private final String apiBaseUrl;
    private final String appPublicBaseUrl;
    private final String frontendPublicBaseUrl;

    public KakaoPayService(
            PaymentOrderRepository paymentOrderRepository,
            UserRepository userRepository,
            MembershipService membershipService,
            ObjectMapper objectMapper,
            @Value("${app.kakaopay.enabled:false}") boolean enabled,
            @Value("${app.kakaopay.secret-key:}") String secretKey,
            @Value("${app.kakaopay.cid:TC0ONETIME}") String cid,
            @Value("${app.kakaopay.api-base-url:https://open-api.kakaopay.com}") String apiBaseUrl,
            @Value("${app.public-base-url:http://localhost:8080}") String appPublicBaseUrl,
            @Value("${app.frontend-public-base-url:http://localhost:3000}") String frontendPublicBaseUrl
    ) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.userRepository = userRepository;
        this.membershipService = membershipService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(HTTP_TIMEOUT_SECONDS)).build();
        this.enabled = enabled;
        this.secretKey = secretKey;
        this.cid = cid;
        this.apiBaseUrl = trimTrailingSlash(apiBaseUrl);
        this.appPublicBaseUrl = trimTrailingSlash(appPublicBaseUrl);
        this.frontendPublicBaseUrl = trimTrailingSlash(frontendPublicBaseUrl);
    }

    @Transactional
    public KakaoPayReadyResponseDto ready(JwtClaims claims) {
        ensureEnabled();
        User user = findUser(claims.userId());
        String orderId = createOrderId(user);
        ObjectNode payload = createReadyPayload(user, orderId);
        JsonNode response = post("/online/v1/payment/ready", payload);

        String tid = response.path("tid").asText("");
        String pcUrl = response.path("next_redirect_pc_url").asText("");
        String mobileUrl = response.path("next_redirect_mobile_url").asText("");
        if (tid.isBlank() || pcUrl.isBlank()) {
            throw new IllegalStateException("카카오페이 결제 준비 응답이 올바르지 않습니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        PaymentOrder order = new PaymentOrder();
        order.setUser(user);
        order.setOrderId(orderId);
        order.setProvider(PROVIDER_KAKAOPAY);
        order.setStatus(STATUS_READY);
        order.setItemName(PRO_ITEM_NAME);
        order.setTid(tid);
        order.setPartnerUserId(partnerUserId(user));
        order.setQuantity(QUANTITY);
        order.setTotalAmount(PRO_PRICE);
        order.setTaxFreeAmount(TAX_FREE_AMOUNT);
        order.setNextRedirectPcUrl(pcUrl);
        order.setNextRedirectMobileUrl(mobileUrl);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        order.setExpiresAt(now.plusMinutes(READY_EXPIRATION_MINUTES));
        paymentOrderRepository.save(order);

        return new KakaoPayReadyResponseDto(orderId, STATUS_READY, pcUrl, order.getExpiresAt());
    }

    @Transactional
    public String approveAndBuildRedirectUrl(String orderId, String pgToken) {
        PaymentOrder order = findOrder(orderId);
        if (STATUS_APPROVED.equals(order.getStatus())) {
            return frontendResultUrl("success", orderId, "already_approved");
        }
        if (!STATUS_READY.equals(order.getStatus())) {
            return frontendResultUrl("fail", orderId, "invalid_status");
        }
        if (pgToken == null || pgToken.isBlank()) {
            markFailed(order, "pg_token is missing.");
            return frontendResultUrl("fail", orderId, "missing_pg_token");
        }
        if (order.getExpiresAt() != null && order.getExpiresAt().isBefore(LocalDateTime.now())) {
            markFailed(order, "Payment ready session expired.");
            return frontendResultUrl("fail", orderId, "expired");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("cid", cid);
        payload.put("tid", order.getTid());
        payload.put("partner_order_id", order.getOrderId());
        payload.put("partner_user_id", order.getPartnerUserId());
        payload.put("pg_token", pgToken);

        try {
            post("/online/v1/payment/approve", payload);
            LocalDateTime now = LocalDateTime.now();
            order.setStatus(STATUS_APPROVED);
            order.setApprovedAt(now);
            order.setUpdatedAt(now);
            paymentOrderRepository.save(order);
            membershipService.activatePro(order.getUser(), order);
            return frontendResultUrl("success", orderId, "approved");
        } catch (RuntimeException exception) {
            markFailed(order, exception.getMessage());
            return frontendResultUrl("fail", orderId, "approve_failed");
        }
    }

    @Transactional
    public String cancelAndBuildRedirectUrl(String orderId) {
        paymentOrderRepository.findByOrderId(orderId).ifPresent(order -> {
            if (!STATUS_APPROVED.equals(order.getStatus())) {
                order.setStatus(STATUS_CANCELED);
                order.setUpdatedAt(LocalDateTime.now());
                paymentOrderRepository.save(order);
            }
        });
        return frontendResultUrl("cancel", orderId, "canceled");
    }

    @Transactional
    public String failAndBuildRedirectUrl(String orderId) {
        paymentOrderRepository.findByOrderId(orderId).ifPresent(order -> markFailed(order, "User returned from KakaoPay failure URL."));
        return frontendResultUrl("fail", orderId, "failed");
    }

    private ObjectNode createReadyPayload(User user, String orderId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("cid", cid);
        payload.put("partner_order_id", orderId);
        payload.put("partner_user_id", partnerUserId(user));
        payload.put("item_name", PRO_ITEM_NAME);
        payload.put("quantity", QUANTITY);
        payload.put("total_amount", PRO_PRICE);
        payload.put("tax_free_amount", TAX_FREE_AMOUNT);
        payload.put("approval_url", appPublicBaseUrl + "/api/payments/kakao/success?order_id=" + encode(orderId));
        payload.put("cancel_url", appPublicBaseUrl + "/api/payments/kakao/cancel?order_id=" + encode(orderId));
        payload.put("fail_url", appPublicBaseUrl + "/api/payments/kakao/fail?order_id=" + encode(orderId));
        return payload;
    }

    private JsonNode post(String path, ObjectNode payload) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + path))
                .timeout(Duration.ofSeconds(HTTP_TIMEOUT_SECONDS))
                .header("Authorization", authorizationHeader())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new PaymentGatewayException(PROVIDER_KAKAOPAY, response.statusCode(), response.body());
            }
            return objectMapper.readTree(response.body());
        } catch (IOException exception) {
            throw new PaymentGatewayException(PROVIDER_KAKAOPAY, "카카오페이 응답을 처리하지 못했습니다.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new PaymentGatewayException(PROVIDER_KAKAOPAY, "카카오페이 요청이 중단되었습니다.", exception);
        }
    }

    private void ensureEnabled() {
        if (!enabled) {
            throw new IllegalArgumentException("카카오페이 결제 연동이 비활성화되어 있습니다.");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalArgumentException("카카오페이 Secret Key가 설정되어 있지 않습니다.");
        }
    }

    private String authorizationHeader() {
        String trimmed = secretKey.trim();
        if (trimmed.startsWith("SECRET_KEY")) {
            return trimmed;
        }
        return "SECRET_KEY " + trimmed;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private PaymentOrder findOrder(String orderId) {
        return paymentOrderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("결제 요청을 찾을 수 없습니다."));
    }

    private String createOrderId(User user) {
        return "CL-" + user.getId() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String partnerUserId(User user) {
        return "user-" + user.getId();
    }

    private void markFailed(PaymentOrder order, String reason) {
        order.setStatus(STATUS_FAILED);
        order.setFailureReason(reason);
        order.setUpdatedAt(LocalDateTime.now());
        paymentOrderRepository.save(order);
    }

    private String frontendResultUrl(String page, String orderId, String reason) {
        return frontendPublicBaseUrl + "/membership/" + page + "?order_id=" + encode(orderId) + "&reason=" + encode(reason);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
