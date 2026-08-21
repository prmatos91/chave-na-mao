package com.impar.crmcarros.oportunidade;

import com.impar.crmcarros.cliente.Cliente;
import com.impar.crmcarros.cliente.ClienteRepository;
import com.impar.crmcarros.cliente.InteressePrincipal;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
import com.impar.crmcarros.oportunidade.dto.OportunidadeRequest;
import com.impar.crmcarros.oportunidade.dto.OportunidadeResponse;
import com.impar.crmcarros.veiculo.StatusVeiculo;
import com.impar.crmcarros.veiculo.Veiculo;
import com.impar.crmcarros.veiculo.VeiculoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OportunidadeServiceTest {

    @Mock
    private OportunidadeRepository repository;
    @Mock
    private ClienteRepository clienteRepository;
    @Mock
    private VeiculoRepository veiculoRepository;

    @InjectMocks
    private OportunidadeService service;

    private Cliente cliente() {
        return Cliente.builder().id(1L).nome("Ana Souza").email("ana@example.com")
                .telefone("11987654321").interessePrincipal(InteressePrincipal.SUV).build();
    }

    private Veiculo veiculoDisponivel() {
        return Veiculo.builder().id(2L).marca("Honda").modelo("HR-V").ano(2024)
                .preco(new BigDecimal("168500.00")).cor("Branco").quilometragem(5000)
                .status(StatusVeiculo.DISPONIVEL).build();
    }

    @Test
    void criar_comClienteEVeiculoValidos_devePersistirOportunidade() {
        Cliente cliente = cliente();
        Veiculo veiculo = veiculoDisponivel();
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(veiculoRepository.findById(2L)).thenReturn(Optional.of(veiculo));
        when(repository.save(any(Oportunidade.class))).thenAnswer(invocation -> {
            Oportunidade o = invocation.getArgument(0);
            o.setId(10L);
            return o;
        });

        OportunidadeRequest request = new OportunidadeRequest(1L, 2L, StatusOportunidade.NOVO_LEAD, null, "Primeiro contato");
        OportunidadeResponse response = service.criar(request);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.status()).isEqualTo(StatusOportunidade.NOVO_LEAD);
        verify(veiculoRepository, never()).save(any());
    }

    @Test
    void criar_comClienteInexistente_deveLancarResourceNotFoundException() {
        when(clienteRepository.findById(1L)).thenReturn(Optional.empty());

        OportunidadeRequest request = new OportunidadeRequest(1L, 2L, StatusOportunidade.NOVO_LEAD, null, null);

        assertThatThrownBy(() -> service.criar(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Cliente");

        verify(repository, never()).save(any());
    }

    @Test
    void criar_comStatusVendido_deveMarcarVeiculoComoVendidoAutomaticamente() {
        Cliente cliente = cliente();
        Veiculo veiculo = veiculoDisponivel();
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(veiculoRepository.findById(2L)).thenReturn(Optional.of(veiculo));
        when(repository.save(any(Oportunidade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OportunidadeRequest request = new OportunidadeRequest(1L, 2L, StatusOportunidade.VENDIDO, new BigDecimal("165000.00"), "Fechado");
        service.criar(request);

        ArgumentCaptor<Veiculo> veiculoCaptor = ArgumentCaptor.forClass(Veiculo.class);
        verify(veiculoRepository).save(veiculoCaptor.capture());
        assertThat(veiculoCaptor.getValue().getStatus()).isEqualTo(StatusVeiculo.VENDIDO);
    }
}
