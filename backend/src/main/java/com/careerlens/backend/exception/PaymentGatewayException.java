package com.careerlens.backend.exception;

public class PaymentGatewayException extends RuntimeException {

    private final String provider;
    private final Integer statusCode;
    private final String responseBody;

    public PaymentGatewayException(String provider, Integer statusCode, String responseBody) {
        super(buildMessage(provider, statusCode, responseBody));
        this.provider = provider;
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public PaymentGatewayException(String provider, String message, Throwable cause) {
        super(provider + " 결제 서버에 연결할 수 없습니다. " + message, cause);
        this.provider = provider;
        this.statusCode = null;
        this.responseBody = "";
    }

    public String getProvider() {
        return provider;
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }

    private static String buildMessage(String provider, Integer statusCode, String responseBody) {
        String safeBody = responseBody == null ? "" : responseBody.replaceAll("\\s+", " ").trim();
        if (safeBody.length() > 240) {
            safeBody = safeBody.substring(0, 240) + "...";
        }
        if (safeBody.isBlank()) {
            return provider + " 결제 요청에 실패했습니다. status=" + statusCode;
        }
        return provider + " 결제 요청에 실패했습니다. status=" + statusCode + ", body=" + safeBody;
    }
}
