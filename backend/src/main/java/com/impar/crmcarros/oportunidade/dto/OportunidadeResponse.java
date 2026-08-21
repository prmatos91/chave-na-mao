package com.impar.crmcarros.oportunidade.dto;

import com.impar.crmcarros.cliente.dto.ClienteResponse;
import com.impar.crmcarros.oportunidade.StatusOportunidade;
import com.impar.crmcarros.veiculo.dto.VeiculoResponse;

import java.math.BigDecimal;
import java.time.Instant;

public record OportunidadeResponse(
        Long id,
        ClienteResponse cliente,
        VeiculoResponse veiculo,
        StatusOportunidade status,
        BigDecimal valorProposto,
        String observacoes,
        Instant createdAt,
        Instant updatedAt
) {
}
