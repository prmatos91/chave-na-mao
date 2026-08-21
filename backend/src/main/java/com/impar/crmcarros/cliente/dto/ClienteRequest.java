package com.impar.crmcarros.cliente.dto;

import com.impar.crmcarros.cliente.InteressePrincipal;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank(message = "Nome e obrigatorio") @Size(max = 150, message = "Nome deve ter no maximo 150 caracteres") String nome,
        @NotBlank(message = "E-mail e obrigatorio") @Email(message = "E-mail invalido") @Size(max = 150) String email,
        @NotBlank(message = "Telefone e obrigatorio") @Size(max = 20, message = "Telefone deve ter no maximo 20 caracteres") String telefone,
        @NotNull(message = "Interesse principal e obrigatorio") InteressePrincipal interessePrincipal
) {
}
