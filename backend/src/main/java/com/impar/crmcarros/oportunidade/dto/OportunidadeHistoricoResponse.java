package com.impar.crmcarros.oportunidade.dto;

import com.impar.crmcarros.oportunidade.StatusOportunidade;

import java.time.Instant;

public record OportunidadeHistoricoResponse(
        Long id,
        StatusOportunidade statusAnterior,
        StatusOportunidade statusNovo,
        Instant alteradoEm
) {
}
