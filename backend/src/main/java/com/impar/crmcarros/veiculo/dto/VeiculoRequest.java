package com.impar.crmcarros.veiculo.dto;

import com.impar.crmcarros.veiculo.StatusVeiculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record VeiculoRequest(
        @NotBlank(message = "Marca e obrigatoria") @Size(max = 100, message = "Marca deve ter no maximo 100 caracteres") String marca,
        @NotBlank(message = "Modelo e obrigatorio") @Size(max = 100, message = "Modelo deve ter no maximo 100 caracteres") String modelo,
        @NotNull(message = "Ano e obrigatorio") @Min(value = 1950, message = "Ano deve ser maior ou igual a 1950") @Max(value = 2100, message = "Ano invalido") Integer ano,
        @NotNull(message = "Preco e obrigatorio") @DecimalMin(value = "0.0", inclusive = false, message = "Preco deve ser maior que zero") BigDecimal preco,
        @NotBlank(message = "Cor e obrigatoria") @Size(max = 50, message = "Cor deve ter no maximo 50 caracteres") String cor,
        @NotNull(message = "Quilometragem e obrigatoria") @Min(value = 0, message = "Quilometragem nao pode ser negativa") Integer quilometragem,
        @NotNull(message = "Status e obrigatorio") StatusVeiculo status
) {
}
