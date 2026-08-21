package com.impar.crmcarros.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI crmCarrosOpenApi() {
        return new OpenAPI().info(new Info()
                .title("CRM de Venda de Carros - API")
                .description("API REST para gestao de veiculos, clientes e oportunidades de venda.")
                .version("v1"));
    }
}
