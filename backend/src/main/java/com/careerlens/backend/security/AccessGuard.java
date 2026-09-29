package com.careerlens.backend.security;

import org.springframework.security.access.AccessDeniedException;

public final class AccessGuard {

    private AccessGuard() {
    }

    public static Long requireUserId(JwtClaims claims) {
        if (claims == null || claims.userId() == null) {
            throw new AccessDeniedException("로그인이 필요한 요청입니다.");
        }
        return claims.userId();
    }

    public static boolean isAdmin(JwtClaims claims) {
        return claims != null && "ADMIN".equalsIgnoreCase(claims.role());
    }

    public static void requireUserOrAdmin(JwtClaims claims, Long ownerUserId) {
        Long currentUserId = requireUserId(claims);
        if (ownerUserId == null || (!currentUserId.equals(ownerUserId) && !isAdmin(claims))) {
            throw new AccessDeniedException("해당 사용자 데이터에 접근할 권한이 없습니다.");
        }
    }
}
