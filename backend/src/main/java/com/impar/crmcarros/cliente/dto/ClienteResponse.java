package com.impar.crmcarros.cliente.dto;

import com.impar.crmcarros.cliente.InteressePrincipal;

import java.time.Instant;

public record ClienteResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        InteressePrincipal interessePrincipal,
        Instant createdAt,
        Instant updatedAt
) {
}
