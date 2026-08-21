package com.impar.crmcarros.oportunidade;

import com.impar.crmcarros.cliente.Cliente;
import com.impar.crmcarros.cliente.ClienteRepository;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
import com.impar.crmcarros.oportunidade.dto.OportunidadeHistoricoResponse;
import com.impar.crmcarros.oportunidade.dto.OportunidadeRequest;
import com.impar.crmcarros.oportunidade.dto.OportunidadeResponse;
import com.impar.crmcarros.veiculo.StatusVeiculo;
import com.impar.crmcarros.veiculo.Veiculo;
import com.impar.crmcarros.veiculo.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Regra de negocio assumida (documentada em docs/AGENT_GUIDE.md): quando uma
 * oportunidade e salva com status VENDIDO, o veiculo associado e marcado
 * automaticamente como VENDIDO, refletindo o fechamento da venda no estoque.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OportunidadeService {

    private final OportunidadeRepository repository;
    private final OportunidadeHistoricoRepository historicoRepository;
    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;

    @Transactional(readOnly = true)
    public Page<OportunidadeResponse> listar(StatusOportunidade status, Long clienteId, Long veiculoId, Pageable pageable) {
        List<Specification<Oportunidade>> specs = new ArrayList<>();
        if (status != null) {
            specs.add(OportunidadeSpecifications.comStatus(status));
        }
        if (clienteId != null) {
            specs.add(OportunidadeSpecifications.comCliente(clienteId));
        }
        if (veiculoId != null) {
            specs.add(OportunidadeSpecifications.comVeiculo(veiculoId));
        }
        Specification<Oportunidade> spec = specs.stream().reduce(Specification::and).orElse(null);
        return repository.findAll(spec, pageable).map(OportunidadeMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public OportunidadeResponse buscarPorId(Long id) {
        return OportunidadeMapper.toResponse(buscarEntidadePorId(id));
    }

    public OportunidadeResponse criar(OportunidadeRequest request) {
        Cliente cliente = buscarClientePorId(request.clienteId());
        Veiculo veiculo = buscarVeiculoPorId(request.veiculoId());

        Oportunidade oportunidade = Oportunidade.builder()
                .cliente(cliente)
                .veiculo(veiculo)
                .status(request.status())
                .valorProposto(request.valorProposto())
                .observacoes(request.observacoes())
                .build();

        oportunidade = repository.save(oportunidade);
        registrarHistorico(oportunidade, null, oportunidade.getStatus());
        aplicarEfeitoColateralDeVenda(oportunidade);
        return OportunidadeMapper.toResponse(oportunidade);
    }

    public OportunidadeResponse atualizar(Long id, OportunidadeRequest request) {
        Oportunidade oportunidade = buscarEntidadePorId(id);
        StatusOportunidade statusAnterior = oportunidade.getStatus();

        if (!oportunidade.getCliente().getId().equals(request.clienteId())) {
            oportunidade.setCliente(buscarClientePorId(request.clienteId()));
        }
        if (!oportunidade.getVeiculo().getId().equals(request.veiculoId())) {
            oportunidade.setVeiculo(buscarVeiculoPorId(request.veiculoId()));
        }
        oportunidade.setStatus(request.status());
        oportunidade.setValorProposto(request.valorProposto());
        oportunidade.setObservacoes(request.observacoes());

        oportunidade = repository.save(oportunidade);
        if (statusAnterior != oportunidade.getStatus()) {
            registrarHistorico(oportunidade, statusAnterior, oportunidade.getStatus());
        }
        aplicarEfeitoColateralDeVenda(oportunidade);
        return OportunidadeMapper.toResponse(oportunidade);
    }

    public void excluir(Long id) {
        Oportunidade oportunidade = buscarEntidadePorId(id);
        repository.delete(oportunidade);
    }

    @Transactional(readOnly = true)
    public List<OportunidadeHistoricoResponse> listarHistorico(Long oportunidadeId) {
        buscarEntidadePorId(oportunidadeId);
        return historicoRepository.findByOportunidadeIdOrderByAlteradoEmAsc(oportunidadeId).stream()
                .map(h -> new OportunidadeHistoricoResponse(h.getId(), h.getStatusAnterior(), h.getStatusNovo(), h.getAlteradoEm()))
                .toList();
    }

    private void registrarHistorico(Oportunidade oportunidade, StatusOportunidade statusAnterior, StatusOportunidade statusNovo) {
        historicoRepository.save(OportunidadeHistorico.builder()
                .oportunidade(oportunidade)
                .statusAnterior(statusAnterior)
                .statusNovo(statusNovo)
                .build());
    }

    private void aplicarEfeitoColateralDeVenda(Oportunidade oportunidade) {
        if (oportunidade.getStatus() == StatusOportunidade.VENDIDO
                && oportunidade.getVeiculo().getStatus() != StatusVeiculo.VENDIDO) {
            Veiculo veiculo = oportunidade.getVeiculo();
            veiculo.setStatus(StatusVeiculo.VENDIDO);
            veiculoRepository.save(veiculo);
        }
    }

    private Oportunidade buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Oportunidade", id));
    }

    private Cliente buscarClientePorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", id));
    }

    private Veiculo buscarVeiculoPorId(Long id) {
        return veiculoRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Veiculo", id));
    }
}
