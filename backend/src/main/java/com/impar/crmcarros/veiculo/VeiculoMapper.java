package com.impar.crmcarros.veiculo;

import com.impar.crmcarros.veiculo.dto.VeiculoRequest;
import com.impar.crmcarros.veiculo.dto.VeiculoResponse;

public final class VeiculoMapper {

    private VeiculoMapper() {
    }

    public static Veiculo toEntity(VeiculoRequest request) {
        return Veiculo.builder()
                .marca(request.marca())
                .modelo(request.modelo())
                .ano(request.ano())
                .preco(request.preco())
                .cor(request.cor())
                .quilometragem(request.quilometragem())
                .status(request.status())
                .build();
    }

    public static void updateEntity(Veiculo veiculo, VeiculoRequest request) {
        veiculo.setMarca(request.marca());
        veiculo.setModelo(request.modelo());
        veiculo.setAno(request.ano());
        veiculo.setPreco(request.preco());
        veiculo.setCor(request.cor());
        veiculo.setQuilometragem(request.quilometragem());
        veiculo.setStatus(request.status());
    }

    public static VeiculoResponse toResponse(Veiculo veiculo) {
        return new VeiculoResponse(
                veiculo.getId(),
                veiculo.getMarca(),
                veiculo.getModelo(),
                veiculo.getAno(),
                veiculo.getPreco(),
                veiculo.getCor(),
                veiculo.getQuilometragem(),
                veiculo.getStatus(),
                veiculo.getCreatedAt(),
                veiculo.getUpdatedAt()
        );
    }
}
