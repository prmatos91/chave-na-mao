package com.impar.crmcarros.oportunidade.dto;

import com.impar.crmcarros.oportunidade.StatusOportunidade;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record OportunidadeRequest(
        @NotNull(message = "Cliente e obrigatorio") Long clienteId,
        @NotNull(message = "Veiculo e obrigatorio") Long veiculoId,
        @NotNull(message = "Status e obrigatorio") StatusOportunidade status,
        @DecimalMin(value = "0.0", message = "Valor proposto nao pode ser negativo") BigDecimal valorProposto,
        @Size(max = 2000, message = "Observacoes devem ter no maximo 2000 caracteres") String observacoes
) {
}
