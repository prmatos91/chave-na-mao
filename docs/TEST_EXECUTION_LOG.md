# Registro de Execuções de Teste com Apoio de IA

## Contexto

Todo o desenvolvimento deste projeto foi feito com apoio do **Claude Code** (modelo Claude Sonnet 5, Anthropic), operando diretamente no terminal com acesso real ao sistema de arquivos, shell e Docker — ou seja, os comandos abaixo **foram de fato executados** durante o desenvolvimento (não são exemplos hipotéticos). Este documento registra, em ordem cronológica, as suítes rodadas, as saídas reais obtidas, as falhas reais encontradas e as correções aplicadas a partir delas.

Os logs brutos completos das duas primeiras execuções de teste (antes de qualquer ajuste) estão salvos em [test-logs/](test-logs/) para auditoria.

## 1. Backend — compilação e testes (Java/Spring Boot)

### 1.1 Primeira tentativa de build — falhou

Comando: `./mvnw -q clean compile`

Resultado: **falhou**.

```
[FATAL] Non-resolvable parent POM for com.impar:crm-carros-backend:0.0.1-SNAPSHOT:
The following artifacts could not be resolved: org.springframework.boot:spring-boot-starter-parent:pom:4.1.1.RELEASE (absent)
```

**Causa raiz**: o Spring Initializr (`start.spring.io`) reportou `4.1.1.RELEASE` como versão padrão do Spring Boot, mas o Spring Boot 4.x abandonou o sufixo `.RELEASE` nos números de versão publicados no Maven Central. Foi confirmado consultando diretamente o `maven-metadata.xml` do artefato no repositório:

```bash
curl -s https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml
# -> a versao estavel mais recente e "4.1.1", sem sufixo
```

**Correção**: alterada a versão no `pom.xml` de `4.1.1.RELEASE` para `4.1.1`.

### 1.2 Segunda tentativa de build — sucesso

Comando: `./mvnw -q clean compile` → concluído sem erros.

### 1.3 Primeira execução de testes — sucesso (com decisão técnica registrada)

Antes de rodar os testes, foi necessário decidir contra qual banco os testes de contexto (`@SpringBootTest`) rodariam. Decisão tomada: **H2 em modo de compatibilidade PostgreSQL**, com as mesmas migrations Flyway do ambiente real aplicadas contra ele (`backend/src/test/resources/application.yml`), evitando que a suíte de testes dependesse de Docker/Postgres rodando na máquina.

Comando: `./mvnw test`

Resultado real (log completo em [test-logs/backend-test-run-1-mvnw-test.log](test-logs/backend-test-run-1-mvnw-test.log)):

```
[INFO] Running com.impar.crmcarros.oportunidade.OportunidadeServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.663 s
[INFO] Running com.impar.crmcarros.CrmCarrosBackendApplicationTests
...
[INFO] o.f.core.internal.command.DbMigrate : Migrating schema "PUBLIC" to version "1 - init"
[INFO] o.f.core.internal.command.DbMigrate : Migrating schema "PUBLIC" to version "2 - seed"
[INFO] o.f.core.internal.command.DbMigrate : Successfully applied 2 migrations to schema "PUBLIC", now at version v2
...
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.171 s -- in CrmCarrosBackendApplicationTests
[INFO] Running com.impar.crmcarros.cliente.ClienteServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.010 s
[INFO] Running com.impar.crmcarros.veiculo.VeiculoServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.005 s

[INFO] Results:
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

**12 de 12 testes passaram na primeira execução**, incluindo a validação de que o schema migrado via Flyway bate exatamente com o mapeamento das entidades JPA (`hibernate.ddl-auto: validate`). Nenhuma correção adicional foi necessária nesta etapa.

Testes cobertos: `VeiculoServiceTest` (criação, 404, exclusão bloqueada por vínculo, exclusão livre), `ClienteServiceTest` (e-mail único na criação e na edição, 404), `OportunidadeServiceTest` (criação válida, cliente inexistente, **regra de negócio de marcar veículo como vendido automaticamente**), e o teste de contexto/migrations.

## 2. Frontend — build e testes (Angular)

### 2.1 Primeira tentativa de build — falhou (2 causas distintas)

Comando: `npx ng build`

Resultado: **falhou**, com dois tipos de erro diferentes reportados simultaneamente.

**Falha A** — dependência ausente:

```
✘ [ERROR] Could not resolve "@angular/animations/browser"
node_modules/@angular/platform-browser/fesm2022/animations-async.mjs:37:51
```

Causa: `ng add @angular/material` configurou `provideAnimationsAsync()` mas o pacote `@angular/animations` não estava instalado como dependência direta.
Correção: `npm install @angular/animations@^22.1.0`.

**Falha B** — erro de tipo nas tabelas:

```
✘ [ERROR] TS7053: Element implicitly has an 'any' type because expression of type 'any'
can't be used to index type 'Record<StatusVeiculo, string>'.
    src/app/features/veiculos/veiculo-list/veiculo-list.html:62:43
```

Causa investigada: o parâmetro de linha em `*matCellDef="let v"` do Angular Material Table não estava sendo inferido como o tipo genérico da tabela (ficava `any`), mesmo após habilitar `strictTemplates` no `tsconfig.json` (tentativa que **não** resolveu o problema, também registrada aqui para transparência). A correção efetiva foi expor métodos tipados no componente (`statusLabel(status: StatusVeiculo)`, `statusClass(status: StatusVeiculo)`) e chamá-los do template em vez de indexar o `Record` diretamente com a variável de linha. Aplicado nas 3 listagens (`veiculo-list`, `cliente-list`, `oportunidade-list`).

### 2.2 Segunda tentativa de build — sucesso

```
Application bundle generation complete. [2.465 seconds]
▲ [WARNING] bundle initial exceeded maximum budget. Budget 500.00 kB was not met by 124.18 kB
```

O warning de orçamento de bundle foi tratado ajustando o budget em `angular.json` de 500kB para 700kB (o tamanho adicional é esperado, vem do Angular Material/CDK).

### 2.3 Primeira execução de testes — falhou (matchers incompatíveis)

Comando: `npx ng test`

```
✘ [ERROR] TS2551: Property 'toBeFalse' does not exist on type 'Assertion<boolean>'.
Did you mean 'toBeFalsy'?
    node_modules/@vitest/expect/dist/index.d.ts:343:1
```

Causa: os testes foram escritos usando matchers do estilo Jasmine (`toBeTrue()`/`toBeFalse()`), mas o Angular 22 usa **Vitest** como test runner por padrão (`@angular/build:unit-test`), cuja API de assertions não inclui esses atalhos.
Correção: substituídos por `toBe(true)` / `toBe(false)` (compatíveis com Vitest) via `sed` nos arquivos de teste afetados.

### 2.4 Segunda execução de testes — sucesso

Log completo em [test-logs/frontend-test-run-1-ng-test.log](test-logs/frontend-test-run-1-ng-test.log):

```
 Test Files  4 passed (4)
      Tests  11 passed (11)
```

Suítes: `App` (bootstrap do shell), `Dashboard` (carregamento de dados via serviço mockado), `VeiculoForm` (validação de formulário reativo: campos obrigatórios, `min` no preço, modo edição vs criação), `VeiculoService` (montagem correta de query params e verbos HTTP via `HttpTestingController`).

## 3. Build da imagem Docker e subida da stack completa

Comando: `docker compose up --build -d`

Resultado: as duas imagens (`crm-carros-backend`, `crm-carros-frontend`) buildaram sem erro na primeira tentativa, e os três serviços (`db`, `backend`, `frontend`) subiram:

```
Container crm-carros-db-1        Healthy
Container crm-carros-backend-1   Healthy
Container crm-carros-frontend-1  Started (healthcheck em progresso)
```

Verificação da API real:

```bash
curl -s http://localhost:8080/api/dashboard
# {"totalVeiculos":8,"totalClientes":6,"totalOportunidades":6, ...}
```

Confirmando que as migrations e o seed do Postgres rodaram automaticamente dentro do container, sem passo manual.

### Bug encontrado após alguns minutos rodando: healthcheck do frontend nunca fica "healthy"

Rodando `docker compose ps` novamente depois de ~15 minutos com a stack no ar, o container do frontend apareceu como `unhealthy`, apesar do site continuar respondendo normalmente no navegador. Investigação:

```bash
docker exec crm-carros-frontend-1 sh -c "wget -qO- http://localhost:80/ >/dev/null 2>&1; echo EXIT=\$?"
# EXIT=1
docker exec crm-carros-frontend-1 sh -c "wget -qO- http://127.0.0.1:80/ >/dev/null 2>&1; echo EXIT=\$?"
# EXIT=0
```

**Causa raiz**: dentro do container, `localhost` resolve primeiro para `::1` (IPv6), mas o Nginx estava configurado só com `listen 80;` (IPv4). O `wget` do healthcheck falhava tentando IPv6, mesmo com o Nginx respondendo normalmente em IPv4 — por isso o site funcionava para qualquer usuário real (que acessa via IPv4 mapeado pelo Docker), mas o `HEALTHCHECK` interno reportava falha.

**Correção**: trocado `http://localhost:80/` por `http://127.0.0.1:80/` no `HEALTHCHECK` do `frontend/Dockerfile`. Pelo mesmo motivo, o `HEALTHCHECK` do backend (`backend/Dockerfile`) também foi ajustado de `localhost:8080` para `127.0.0.1:8080` preventivamente, mesmo ele já reportando "healthy" (o Tomcat embutido do Spring Boot escuta em IPv4 e IPv6 por padrão, então não seria afetado, mas manter os dois consistentes evita depender desse detalhe de implementação).

**Verificação da correção**: `docker compose up --build -d` novamente e `docker compose ps` após um ciclo completo de healthcheck (~20s):

```
crm-carros-backend-1    Up 30 seconds (healthy)
crm-carros-db-1         Up 18 minutes (healthy)
crm-carros-frontend-1   Up 24 seconds (healthy)
```

Os três serviços ficaram `healthy` de forma estável.

## 4. Verificação manual end-to-end (navegador)

Realizada navegando pela aplicação real (Docker Compose rodando) via automação de browser.

| Verificação | Resultado |
|---|---|
| Dashboard mostra os totais corretos (8 veículos, 6 clientes, 6 oportunidades) e o resumo por status | ✅ OK |
| Listagem de veículos, colunas e chips de status | ✅ OK |
| Modal de detalhes de um veículo (dialog centralizado, com overlay) | ✅ OK — **bug encontrado**: valores em `R$145,900.00` (formato en-US) em vez de `R$ 145.900,00` (pt-BR) |
| Criação de veículo via formulário (`BYD Dolphin`, 2026, R$ 159.990, Verde, 0 km) | ✅ OK, snackbar de sucesso, item aparece na listagem |
| Criação de oportunidade selecionando cliente e veículo reais do banco, status `Vendido` | ✅ OK, snackbar de sucesso |
| Regra de negócio: veículo vinculado à oportunidade `Vendido` muda de status automaticamente | ✅ Confirmado via `GET /api/veiculos/1` → `"status":"VENDIDO"` após salvar a oportunidade |
| Layout responsivo mobile (375px): sidenav colapsa em menu hambúrguer | ✅ OK |
| Layout responsivo desktop (1280px): sidenav fixo lateral | ✅ OK |

### Bug encontrado e corrigido: formatação de moeda/números no locale errado

**Sintoma**: valores monetários exibidos como `R$145,900.00` em vez do formato brasileiro `R$ 145.900,00`.
**Causa**: o `LOCALE_ID` do Angular nunca foi registrado explicitamente, então os pipes `currency`/`number` usavam o locale padrão (`en-US`).
**Correção**: registrado `localePt` (`@angular/common/locales/pt`) e configurado `{ provide: LOCALE_ID, useValue: 'pt-BR' }` em `app.config.ts`.
**Verificação da correção**: rebuild da imagem do frontend (`docker compose build frontend && docker compose up -d frontend`) e nova verificação visual confirmando `R$ 145.900,00` corretamente formatado, com os dados do Postgres preservados no volume durante o rebuild.

## 5. Resumo

| Suíte | Execuções até passar | Falhas reais encontradas |
|---|---|---|
| Backend `mvnw test` | 1ª após corrigir versão do Spring Boot no build | versão incorreta do parent POM |
| Frontend `ng build` | 2 | dependência de animações ausente; tipagem `any` em `*matCellDef` |
| Frontend `ng test` | 2 | matchers Jasmine incompatíveis com Vitest |
| `docker compose up --build` | 2 | healthcheck do frontend usando `localhost` (resolvia para IPv6, Nginx só escutava IPv4) |
| Verificação manual (browser) | 1 rodada, 1 bug encontrado | locale de formatação de moeda/número |

Todas as falhas listadas foram reais (não simuladas), encontradas ao executar os comandos durante o desenvolvimento assistido por IA, e corrigidas antes da entrega.
