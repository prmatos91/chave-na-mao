package com.impar.crmcarros.oportunidade;

import com.impar.crmcarros.cliente.ClienteMapper;
import com.impar.crmcarros.oportunidade.dto.OportunidadeResponse;
import com.impar.crmcarros.veiculo.VeiculoMapper;

public final class OportunidadeMapper {

    private OportunidadeMapper() {
    }

    public static OportunidadeResponse toResponse(Oportunidade oportunidade) {
        return new OportunidadeResponse(
                oportunidade.getId(),
                ClienteMapper.toResponse(oportunidade.getCliente()),
                VeiculoMapper.toResponse(oportunidade.getVeiculo()),
                oportunidade.getStatus(),
                oportunidade.getValorProposto(),
                oportunidade.getObservacoes(),
                oportunidade.getCreatedAt(),
                oportunidade.getUpdatedAt()
        );
    }
}
