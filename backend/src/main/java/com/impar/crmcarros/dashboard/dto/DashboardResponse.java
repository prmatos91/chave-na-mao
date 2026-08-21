package com.impar.crmcarros.dashboard.dto;

import com.impar.crmcarros.oportunidade.StatusOportunidade;
import com.impar.crmcarros.veiculo.StatusVeiculo;

import java.util.Map;

public record DashboardResponse(
        long totalVeiculos,
        long totalClientes,
        long totalOportunidades,
        Map<StatusVeiculo, Long> veiculosPorStatus,
        Map<StatusOportunidade, Long> oportunidadesPorStatus
) {
}
