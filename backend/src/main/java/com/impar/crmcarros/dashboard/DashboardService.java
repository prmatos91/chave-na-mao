package com.impar.crmcarros.dashboard;

import com.impar.crmcarros.cliente.ClienteRepository;
import com.impar.crmcarros.dashboard.dto.DashboardResponse;
import com.impar.crmcarros.oportunidade.OportunidadeRepository;
import com.impar.crmcarros.oportunidade.StatusOportunidade;
import com.impar.crmcarros.veiculo.StatusVeiculo;
import com.impar.crmcarros.veiculo.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final VeiculoRepository veiculoRepository;
    private final ClienteRepository clienteRepository;
    private final OportunidadeRepository oportunidadeRepository;

    public DashboardResponse gerar() {
        Map<StatusVeiculo, Long> veiculosPorStatus = new LinkedHashMap<>();
        for (StatusVeiculo status : StatusVeiculo.values()) {
            veiculosPorStatus.put(status, veiculoRepository.countByStatus(status));
        }

        Map<StatusOportunidade, Long> oportunidadesPorStatus = new LinkedHashMap<>();
        for (StatusOportunidade status : StatusOportunidade.values()) {
            oportunidadesPorStatus.put(status, oportunidadeRepository.countByStatus(status));
        }

        return new DashboardResponse(
                veiculoRepository.count(),
                clienteRepository.count(),
                oportunidadeRepository.count(),
                veiculosPorStatus,
                oportunidadesPorStatus
        );
    }
}
