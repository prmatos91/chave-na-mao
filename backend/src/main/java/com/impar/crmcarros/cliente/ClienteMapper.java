package com.impar.crmcarros.cliente;

import com.impar.crmcarros.cliente.dto.ClienteRequest;
import com.impar.crmcarros.cliente.dto.ClienteResponse;

public final class ClienteMapper {

    private ClienteMapper() {
    }

    public static Cliente toEntity(ClienteRequest request) {
        return Cliente.builder()
                .nome(request.nome())
                .email(request.email())
                .telefone(request.telefone())
                .interessePrincipal(request.interessePrincipal())
                .build();
    }

    public static void updateEntity(Cliente cliente, ClienteRequest request) {
        cliente.setNome(request.nome());
        cliente.setEmail(request.email());
        cliente.setTelefone(request.telefone());
        cliente.setInteressePrincipal(request.interessePrincipal());
    }

    public static ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getEmail(),
                cliente.getTelefone(),
                cliente.getInteressePrincipal(),
                cliente.getCreatedAt(),
                cliente.getUpdatedAt()
        );
    }
}
