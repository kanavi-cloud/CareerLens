package com.careerlens.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AccountUpdateRequestDto(
        @NotBlank @Size(max = 40) String displayName,
        @Email @NotBlank @Size(max = 120) String email,
        @Size(max = 10) String countryDialCode,
        @Size(max = 30) String phoneNumber,
        Boolean marketingOptIn
) {
}
