package com.impar.crmcarros.cliente;

import com.impar.crmcarros.cliente.dto.ClienteRequest;
import com.impar.crmcarros.cliente.dto.ClienteResponse;
import com.impar.crmcarros.common.exception.BusinessRuleException;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository repository;

    @InjectMocks
    private ClienteService service;

    private ClienteRequest requestValido() {
        return new ClienteRequest("Ana Souza", "ana.souza@example.com", "11987654321", InteressePrincipal.SUV);
    }

    private Cliente clienteExistente() {
        return Cliente.builder()
                .id(1L)
                .nome("Ana Souza")
                .email("ana.souza@example.com")
                .telefone("11987654321")
                .interessePrincipal(InteressePrincipal.SUV)
                .build();
    }

    @Test
    void criar_comEmailInedito_deveSalvarComSucesso() {
        when(repository.findByEmailIgnoreCase("ana.souza@example.com")).thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(Cliente.class))).thenReturn(clienteExistente());

        ClienteResponse response = service.criar(requestValido());

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.email()).isEqualTo("ana.souza@example.com");
    }

    @Test
    void criar_comEmailJaCadastradoPorOutroCliente_deveLancarBusinessRuleException() {
        when(repository.findByEmailIgnoreCase("ana.souza@example.com")).thenReturn(Optional.of(clienteExistente()));

        assertThatThrownBy(() -> service.criar(requestValido()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("ana.souza@example.com");

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void atualizar_comMesmoEmailDoProprioCliente_naoDeveLancarExcecao() {
        Cliente existente = clienteExistente();
        when(repository.findById(1L)).thenReturn(Optional.of(existente));
        when(repository.findByEmailIgnoreCase("ana.souza@example.com")).thenReturn(Optional.of(existente));
        when(repository.saveAndFlush(any(Cliente.class))).thenReturn(existente);

        ClienteResponse response = service.atualizar(1L, requestValido());

        assertThat(response.id()).isEqualTo(1L);
    }

    @Test
    void criar_comCorridaDeConcorrenciaNoEmail_deveConverterParaBusinessRuleException() {
        when(repository.findByEmailIgnoreCase("ana.souza@example.com")).thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(Cliente.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("unique constraint violado"));

        assertThatThrownBy(() -> service.criar(requestValido()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("ana.souza@example.com");
    }

    @Test
    void buscarPorId_quandoNaoExiste_deveLancarResourceNotFoundException() {
        when(repository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(42L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
