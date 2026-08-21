package com.impar.crmcarros.cliente;

import com.impar.crmcarros.cliente.dto.ClienteRequest;
import com.impar.crmcarros.cliente.dto.ClienteResponse;
import com.impar.crmcarros.common.exception.BusinessRuleException;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
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
public class ClienteService {

    private final ClienteRepository repository;

    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(InteressePrincipal interesse, String q, Pageable pageable) {
        List<Specification<Cliente>> specs = new ArrayList<>();
        if (interesse != null) {
            specs.add(ClienteSpecifications.comInteresse(interesse));
        }
        if (q != null && !q.isBlank()) {
            specs.add(ClienteSpecifications.comTexto(q.trim()));
        }
        Specification<Cliente> spec = specs.stream().reduce(Specification::and).orElse(null);
        return repository.findAll(spec, pageable).map(ClienteMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        return ClienteMapper.toResponse(buscarEntidadePorId(id));
    }

    public ClienteResponse criar(ClienteRequest request) {
        validarEmailDisponivel(request.email(), null);
        Cliente cliente = salvarTratandoEmailDuplicado(ClienteMapper.toEntity(request));
        return ClienteMapper.toResponse(cliente);
    }

    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscarEntidadePorId(id);
        validarEmailDisponivel(request.email(), id);
        ClienteMapper.updateEntity(cliente, request);
        return ClienteMapper.toResponse(salvarTratandoEmailDuplicado(cliente));
    }

    /**
     * A checagem de {@link #validarEmailDisponivel} evita a maioria dos casos, mas nao
     * fecha uma corrida de concorrencia entre duas requisicoes simultaneas com o mesmo
     * e-mail; a constraint UNIQUE do banco e a rede de seguranca final para esse caso.
     */
    private Cliente salvarTratandoEmailDuplicado(Cliente cliente) {
        try {
            return repository.saveAndFlush(cliente);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessRuleException("Ja existe um cliente cadastrado com o e-mail " + cliente.getEmail());
        }
    }

    public void excluir(Long id) {
        Cliente cliente = buscarEntidadePorId(id);
        try {
            repository.delete(cliente);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessRuleException(
                    "Nao e possivel excluir este cliente pois ele possui oportunidades de venda associadas.");
        }
    }

    private void validarEmailDisponivel(String email, Long idAtual) {
        repository.findByEmailIgnoreCase(email)
                .filter(c -> idAtual == null || !c.getId().equals(idAtual))
                .ifPresent(c -> {
                    throw new BusinessRuleException("Ja existe um cliente cadastrado com o e-mail " + email);
                });
    }

    private Cliente buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Cliente", id));
    }
}
