package com.impar.crmcarros.veiculo.dto;

import com.impar.crmcarros.veiculo.StatusVeiculo;

import java.math.BigDecimal;
import java.time.Instant;

public record VeiculoResponse(
        Long id,
        String marca,
        String modelo,
        Integer ano,
        BigDecimal preco,
        String cor,
        Integer quilometragem,
        StatusVeiculo status,
        Instant createdAt,
        Instant updatedAt
) {
}
