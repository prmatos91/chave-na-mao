package com.impar.crmcarros.veiculo;

import com.impar.crmcarros.common.exception.BusinessRuleException;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
import com.impar.crmcarros.veiculo.dto.VeiculoRequest;
import com.impar.crmcarros.veiculo.dto.VeiculoResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VeiculoServiceTest {

    @Mock
    private VeiculoRepository repository;

    @InjectMocks
    private VeiculoService service;

    private VeiculoRequest requestValido() {
        return new VeiculoRequest("Toyota", "Corolla", 2023, new BigDecimal("145900.00"), "Prata", 12000, StatusVeiculo.DISPONIVEL);
    }

    private Veiculo veiculoSalvo() {
        return Veiculo.builder()
                .id(1L)
                .marca("Toyota")
                .modelo("Corolla")
                .ano(2023)
                .preco(new BigDecimal("145900.00"))
                .cor("Prata")
                .quilometragem(12000)
                .status(StatusVeiculo.DISPONIVEL)
                .build();
    }

    @Test
    void criar_deveSalvarERetornarResponseCorrespondente() {
        when(repository.save(any(Veiculo.class))).thenReturn(veiculoSalvo());

        VeiculoResponse response = service.criar(requestValido());

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.marca()).isEqualTo("Toyota");
        assertThat(response.status()).isEqualTo(StatusVeiculo.DISPONIVEL);
    }

    @Test
    void buscarPorId_quandoNaoExiste_deveLancarResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void excluir_quandoVeiculoTemOportunidadesAssociadas_deveLancarBusinessRuleException() {
        Veiculo veiculo = veiculoSalvo();
        when(repository.findById(1L)).thenReturn(Optional.of(veiculo));
        doThrow(new DataIntegrityViolationException("FK violation")).when(repository).flush();

        assertThatThrownBy(() -> service.excluir(1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("oportunidades");

        verify(repository, times(1)).delete(veiculo);
    }

    @Test
    void excluir_quandoVeiculoNaoTemVinculos_deveExcluirNormalmente() {
        Veiculo veiculo = veiculoSalvo();
        when(repository.findById(1L)).thenReturn(Optional.of(veiculo));

        service.excluir(1L);

        verify(repository, times(1)).delete(veiculo);
        verify(repository, never()).findAll();
    }
}
