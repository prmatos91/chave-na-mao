package com.impar.crmcarros.veiculo;

import com.impar.crmcarros.common.exception.GlobalExceptionHandler;
import com.impar.crmcarros.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de fatia web (sem subir o contexto Spring inteiro) garantindo que o
 * GlobalExceptionHandler traduz corretamente os erros de entrada do cliente
 * para o status HTTP certo - especificamente o cenario encontrado na auditoria
 * manual: um id nao numerico na URL deve virar 400, nunca 500.
 */
@ExtendWith(MockitoExtension.class)
class VeiculoControllerWebTest {

    @Mock
    private VeiculoService service;

    private MockMvc mockMvc;

    private MockMvc mockMvc() {
        if (mockMvc == null) {
            mockMvc = MockMvcBuilders.standaloneSetup(new VeiculoController(service))
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();
        }
        return mockMvc;
    }

    @Test
    void buscarPorId_comIdNaoNumerico_deveRetornar400() throws Exception {
        mockMvc().perform(get("/api/veiculos/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void buscarPorId_comIdInexistente_deveRetornar404() throws Exception {
        when(service.buscarPorId(eq(999L))).thenThrow(ResourceNotFoundException.of("Veiculo", 999L));

        mockMvc().perform(get("/api/veiculos/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Veiculo nao encontrado(a) com id 999"));
    }
}
