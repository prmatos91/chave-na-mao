package com.impar.crmcarros.veiculo;

import com.impar.crmcarros.common.exception.BusinessRuleException;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
import com.impar.crmcarros.veiculo.dto.VeiculoRequest;
import com.impar.crmcarros.veiculo.dto.VeiculoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VeiculoService {

    private final VeiculoRepository repository;

    @Transactional(readOnly = true)
    public Page<VeiculoResponse> listar(StatusVeiculo status, String q, Pageable pageable) {
        List<Specification<Veiculo>> specs = new ArrayList<>();
        if (status != null) {
            specs.add(VeiculoSpecifications.comStatus(status));
        }
        if (q != null && !q.isBlank()) {
            specs.add(VeiculoSpecifications.comTexto(q.trim()));
        }
        Specification<Veiculo> spec = specs.stream().reduce(Specification::and).orElse(null);
        return repository.findAll(spec, pageable).map(VeiculoMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public VeiculoResponse buscarPorId(Long id) {
        return VeiculoMapper.toResponse(buscarEntidadePorId(id));
    }

    @Transactional(readOnly = true)
    public List<String> listarMarcas() {
        return repository.findDistinctMarcas();
    }

    @Transactional(readOnly = true)
    public List<String> listarModelosPorMarca(String marca) {
        return repository.findDistinctModelosPorMarca(marca);
    }

    @Transactional(readOnly = true)
    public List<String> listarCores() {
        return repository.findDistinctCores();
    }

    public VeiculoResponse criar(VeiculoRequest request) {
        Veiculo veiculo = repository.save(VeiculoMapper.toEntity(request));
        return VeiculoMapper.toResponse(veiculo);
    }

    public VeiculoResponse atualizar(Long id, VeiculoRequest request) {
        Veiculo veiculo = buscarEntidadePorId(id);
        VeiculoMapper.updateEntity(veiculo, request);
        return VeiculoMapper.toResponse(repository.save(veiculo));
    }

    public void excluir(Long id) {
        Veiculo veiculo = buscarEntidadePorId(id);
        try {
            repository.delete(veiculo);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessRuleException(
                    "Nao e possivel excluir este veiculo pois ele possui oportunidades de venda associadas.");
        }
    }

    private Veiculo buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Veiculo", id));
    }
}
