package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequestDto(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8) String newPassword,
        @NotBlank String newPasswordConfirm
) {
}
