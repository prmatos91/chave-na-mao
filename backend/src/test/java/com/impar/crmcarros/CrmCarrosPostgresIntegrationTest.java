package com.impar.crmcarros;

import com.impar.crmcarros.veiculo.StatusVeiculo;
import com.impar.crmcarros.veiculo.Veiculo;
import com.impar.crmcarros.veiculo.VeiculoRepository;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Diferente de {@link CrmCarrosBackendApplicationTests} (que roda contra H2 em modo
 * PostgreSQL, rapido e sem dependencia de Docker), este teste sobe um PostgreSQL real
 * via Testcontainers e valida que as migrations Flyway e o mapeamento JPA funcionam
 * de fato contra o mesmo motor de banco usado em producao - fechando a lacuna que
 * o H2 nao cobre.
 *
 * <p>Nao usamos as anotacoes {@code @Testcontainers}/{@code @Container} de proposito:
 * elas iniciam o container antes de qualquer {@code @BeforeAll} do proprio teste rodar,
 * o que impediria a checagem de disponibilidade do Docker abaixo de pular a classe de
 * forma limpa (ver a checagem de disponibilidade no {@code @BeforeAll} e o relato real
 * dessa investigacao em docs/TEST_EXECUTION_LOG.md).</p>
 */
@SpringBootTest
class CrmCarrosPostgresIntegrationTest {

    private static PostgreSQLContainer<?> postgres;

    @BeforeAll
    static void verificarDockerDisponivel() {
        boolean disponivel;
        try {
            disponivel = DockerClientFactory.instance().isDockerAvailable();
        } catch (Exception ex) {
            disponivel = false;
        }
        Assumptions.assumeTrue(disponivel,
                "Docker nao esta acessivel para o Testcontainers neste ambiente - pulando o teste "
                        + "de integracao contra PostgreSQL real. Ver docs/TEST_EXECUTION_LOG.md.");
    }

    @DynamicPropertySource
    static void configurarDatasource(DynamicPropertyRegistry registry) {
        if (!DockerClientFactory.instance().isDockerAvailable()) {
            return;
        }
        postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("crm_carros_test")
                .withUsername("crm_carros_test")
                .withPassword("crm_carros_test");
        postgres.start();

        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Sem isto, o Spring as vezes infere o driver a partir do H2 usado em
        // src/test/resources/application.yml (mesmo com a url do Postgres correta
        // vindo daqui) - problema real encontrado rodando este teste pela primeira
        // vez com Docker de verdade disponivel (ver docs/TEST_EXECUTION_LOG.md).
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }

    @Autowired
    private VeiculoRepository veiculoRepository;

    @Test
    void contextoSobeEMigrationsAplicamContraPostgresReal() {
        // Se o Flyway/Hibernate nao validasse corretamente o schema real do Postgres,
        // o contexto Spring nao subiria e este teste falharia ao ser instanciado.
        assertThat(postgres.isRunning()).isTrue();
    }

    @Test
    void salvarEBuscarVeiculo_devePersistirDeVerdadeNoPostgres() {
        Veiculo veiculo = Veiculo.builder()
                .marca("Tesla")
                .modelo("Model 3")
                .ano(2024)
                .preco(new BigDecimal("289990.00"))
                .cor("Branco")
                .quilometragem(0)
                .status(StatusVeiculo.DISPONIVEL)
                .build();

        Veiculo salvo = veiculoRepository.saveAndFlush(veiculo);

        assertThat(salvo.getId()).isNotNull();
        assertThat(veiculoRepository.findById(salvo.getId()))
                .isPresent()
                .get()
                .satisfies(v -> assertThat(v.getMarca()).isEqualTo("Tesla"));
    }
}
