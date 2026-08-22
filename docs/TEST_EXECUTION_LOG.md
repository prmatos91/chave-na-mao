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

## 5. Fase 2 — auditoria adicional e melhorias pedidas depois da primeira entrega

Depois da primeira rodada (seções 1-4), foi pedido uma auditoria mais profunda do projeto já funcionando, testando comportamento real (não só lendo código), e um conjunto de melhorias adicionais. Esta seção documenta essa segunda rodada, incluindo os problemas reais encontrados.

### 5.1 Auditoria manual — testando comportamento real da API já rodando

Com a stack já de pé via `docker compose up --build -d`, foram feitos testes diretos de comportamento (não apenas leitura de código):

```bash
curl -s -w "\nHTTP_STATUS=%{http_code}\n" http://localhost:8080/api/veiculos/abc
# HTTP_STATUS=500  <- deveria ser 400 (id invalido e erro do cliente, nao do servidor)

curl -s -D - -o /dev/null http://localhost:8080/api/dashboard
# nenhum header X-Content-Type-Options, X-Frame-Options ou Referrer-Policy

curl -s -D - -o /dev/null -H "Origin: http://evil.com" http://localhost:8080/api/veiculos
# HTTP/1.1 403  <- CORS bloqueando origem nao autorizada, confirmado correto
```

**4 problemas reais encontrados e corrigidos:**

1. `GET /api/veiculos/abc` retornava 500 em vez de 400 — faltava `@ExceptionHandler(MethodArgumentTypeMismatchException.class)`. Corrigido e coberto por um novo teste (`VeiculoControllerWebTest`, usando `MockMvcBuilders.standaloneSetup`).
2. O handler genérico de exceções não logava nada no servidor — adicionado `log.error(...)` antes de responder ao cliente (nunca expondo o detalhe na resposta).
3. Faltavam headers de segurança HTTP — adicionado um `SecurityHeadersFilter` no backend e `add_header` no `nginx.conf` do frontend (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, mais `server_tokens off`).
4. Condição de corrida no e-mail duplicado do cliente — `ClienteService.criar`/`atualizar` agora tratam `DataIntegrityViolationException` do `saveAndFlush`, convertendo para 409 em vez de deixar virar 500. Ao implementar a correção, um teste (`criar_comEmailInedito_deveSalvarComSucesso`) quebrou porque o metodo auxiliar retornava a entidade original (sem o id gerado) em vez do resultado de `saveAndFlush` — bug introduzido na hora e corrigido antes de seguir.

Verificação ao vivo depois do rebuild (`docker compose up --build -d backend`):

```
GET /api/veiculos/abc -> 400 {"message":"Parametro 'id' invalido..."}
Headers: X-Content-Type-Options: nosniff / X-Frame-Options: DENY / Referrer-Policy: no-referrer-when-downgrade
POST /api/clientes (email duplicado) -> 409 {"message":"Ja existe um cliente cadastrado..."}
```

### 5.2 Testcontainers — tentativa de validar contra PostgreSQL real

Foi adicionado um teste de integração (`CrmCarrosPostgresIntegrationTest`) usando Testcontainers para rodar as migrations e o mapeamento JPA contra um PostgreSQL real (não H2), fechando a lacuna documentada na primeira entrega.

**Resultado real, não o esperado**: o teste falhou com `IllegalStateException: Could not find a valid Docker environment`, mesmo com o Docker funcionando perfeitamente (confirmado rodando `docker compose` normalmente ao mesmo tempo). Investigação:

```bash
curl -s --unix-socket /var/run/docker.sock http://localhost/v1.24/info   # HTTP 400, corpo vazio/zerado
curl -s --unix-socket /var/run/docker.sock http://localhost/v1.40/info   # HTTP 200, dados reais
curl -s --unix-socket /var/run/docker.sock http://localhost/info         # HTTP 200 (sem versionar), dados reais
```

**Causa raiz identificada**: o Docker Desktop instalado (4.87.0 / Engine 29.7.2, API 1.55, `MinAPIVersion: 1.40`) responde com um HTTP 400 malformado para chamadas usando versões da API do Docker abaixo de 1.40. A checagem interna de disponibilidade do Testcontainers 1.21.3 (a versão mais recente publicada no Maven Central no momento desta entrega) usa uma API antiga nessa checagem especifica, incompativel com essa versao do Docker Desktop. Setar a variavel `DOCKER_API_VERSION=1.43` no ambiente nao resolveu, porque a checagem de disponibilidade acontece antes de qualquer negociacao de versao configuravel.

**Decisão tomada**: em vez de simplesmente descartar o teste (que é real e correto), ele foi reescrito para checar `DockerClientFactory.instance().isDockerAvailable()` num `@BeforeAll` e pular a classe de forma limpa (`Assumptions.assumeTrue`) quando o Docker não estiver acessível ao Testcontainers nesse ambiente especifico — sem quebrar `mvnw test`. Isso é uma limitação de ambiente desta máquina de desenvolvimento (Docker Desktop bleeding-edge), não do código: o teste deve funcionar normalmente em ambientes com Docker Engine "puro" (como os runners do GitHub Actions, que não passam pela camada de proxy do Docker Desktop) — algo que será confirmado na primeira execução real do CI após o push.

```
[INFO] Tests run: 0, Failures: 0, Errors: 0, Skipped: 0 -- in CrmCarrosPostgresIntegrationTest
[INFO] BUILD SUCCESS (15 outros testes passando normalmente)
```

### 5.2.1 Confirmação real no CI — e um segundo bug real encontrado

Depois do primeiro push, o pipeline de CI rodou pela primeira vez de verdade no GitHub Actions (runner Ubuntu padrão, Docker Engine puro — exatamente o cenário que a seção anterior previu que funcionaria). O resultado confirmou a hipótese e revelou um **segundo bug real**, que só aparece quando o Docker está de fato disponível para o Testcontainers:

```
23:28:39.902 [main] INFO ... DockerClientProviderStrategy -- Found Docker environment with local Unix socket
...
[ERROR] Tests run: 2, Failures: 0, Errors: 2, Skipped: 0 -- in CrmCarrosPostgresIntegrationTest
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' ...:
  Driver org.h2.Driver claims to not accept jdbcUrl, jdbc:postgresql://localhost:32769/crm_carros_test?loggerLevel=OFF
```

**Causa raiz**: o `@DynamicPropertySource` sobrescrevia `spring.datasource.url/username/password` com os valores do container Testcontainers, mas **não** `spring.datasource.driver-class-name`. Mesmo com a URL do Postgres correta chegando ao Spring, o driver ficou "preso" no H2 (inferido a partir do `src/test/resources/application.yml`, usado pela suíte H2). Como esse bug só se manifesta depois que o Testcontainers consegue de fato subir o container, ele nunca apareceu localmente — a máquina de desenvolvimento usada nunca passou dessa etapa por causa do bug de detecção do Docker Desktop descrito acima. Foi só com uma execução real em um ambiente onde a primeira barreira não existia que esse segundo problema pôde ser encontrado.

**Correção**: adicionado `registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver")` explicitamente no `@DynamicPropertySource`, eliminando a dependência de inferência automática. Corrigido e re-enviado para validação no CI (ver resultado final na seção 5.6).

Esse é um exemplo concreto de por que ter CI real importa: o bug só existia no caminho de execução que a máquina de desenvolvimento local nunca conseguiu alcançar.

### 5.3 Histórico de status da oportunidade

Nova migration (`V3__oportunidade_historico.sql`), entidade, repositório e endpoint `GET /api/oportunidades/{id}/historico`. Testado ao vivo:

```bash
curl -s http://localhost:8080/api/oportunidades/1/historico
# [{"id":1,"statusAnterior":null,"statusNovo":"EM_NEGOCIACAO","alteradoEm":"2026-08-21T23:03:48Z"}]
```

Editada a oportunidade #1 pela UI (status "Em negociação" → "Vendido") e confirmado visualmente que: (a) uma nova entrada apareceu na timeline com o texto "Em negociação → Vendido"; (b) o veículo associado (Honda HR-V) passou automaticamente para "Vendido" na sua própria página de detalhe — a regra de negócio documentada continua funcionando após a mudança de modal para rota.

Testes de service adicionados (`OportunidadeServiceTest`): status inicial gravado na criação, mudança de status gera entrada de histórico, ausência de mudança de status **não** gera entrada. Todos passando.

### 5.4 Frontend — troca de modal por rotas de detalhe

Os 3 diálogos de detalhe (`*-detail-dialog`) foram removidos e substituídos por páginas roteadas (`/veiculos/:id`, `/clientes/:id`, `/oportunidades/:id`), com a página de oportunidade incluindo a timeline do histórico. `ng build` e `ng test` confirmados passando (11/11) depois da troca — nenhuma regressão de tipagem, já que o padrão `@if (sinal(); as x)` do Angular tipa `x` corretamente (diferente da limitação já documentada do `*matCellDef` nas tabelas).

### 5.5 Testes E2E automatizados (Playwright)

Foram escritos 7 testes E2E (`frontend/e2e/*.spec.ts`) rodando contra a stack real via Docker Compose, cobrindo: dashboard, navegação pelo menu, CRUD completo de veículo (criar → visualizar → editar → excluir), validação de formulário vazio, CRUD de cliente, bloqueio de e-mail duplicado, e o fluxo de ponta a ponta da regra de negócio (criar oportunidade como "Vendido" → conferir que o veículo vinculado aparece como "Vendido" na tela dele → conferir a timeline).

**Falhas reais encontradas ao rodar pela primeira vez:**

1. **3 de 7 testes falharam por timeout** logo na primeira execução — os seletores `getByLabel('Visualizar'|'Editar'|'Excluir')` não encontravam nada. Causa: os `aria-label` tinham acabado de ser adicionados aos botões de ícone das listagens (também uma melhoria real de acessibilidade, não só para os testes), mas o container Docker do frontend ainda estava com o build anterior — esquecimento de rodar `docker compose up --build -d frontend` antes de rodar os testes E2E. Corrigido rebuildando o container.
2. **Depois do rebuild, o teste de oportunidade ainda falhava** na etapa de limpeza (exclusão dos dados criados pelo próprio teste), com um botão "Excluir" errado sendo clicado (ficava atrás do overlay escurecido do diálogo, sem conseguir clicar). Causa: o seletor `getByRole('button', { name: 'Excluir' }).last()` é ambíguo quando existem várias linhas com botão de excluir na tela **e** o diálogo de confirmação aberto — `.last()` nem sempre resolve para o botão do diálogo. Corrigido trocando para `page.getByRole('dialog').getByRole('button', { name: 'Excluir' })`, escopado corretamente ao diálogo modal (Angular Material define `role="dialog"` no container).
3. Mesmo com o seletor corrigido, a limpeza da oportunidade criada pelo teste **passava sem erro mas não excluía nada de fato** — o registro ficava numa página de listagem diferente da primeira (paginação padrão de 10 itens), já que o teste não filtrava a lista de oportunidades antes de tentar excluir. Corrigido usando o filtro por cliente já existente na tela antes de excluir, e adicionadas asserções explícitas da mensagem de sucesso em cada exclusão da limpeza, para que qualquer falha futura apareça como um erro claro em vez de passar silenciosamente.

Resultado final, real, depois das 3 correções acima (log completo em [test-logs/e2e-playwright-run-final.log](test-logs/e2e-playwright-run-final.log)):

```
Running 7 tests using 1 worker
  ✓ Clientes - cria e exclui um cliente
  ✓ Clientes - bloqueia cadastro com e-mail ja utilizado
  ✓ Dashboard - carrega e mostra os indicadores principais
  ✓ Dashboard - navega para as demais telas pelo menu lateral
  ✓ Oportunidades - Vendido marca o veiculo associado como Vendido automaticamente
  ✓ Veiculos - cria, visualiza, edita e exclui um veiculo
  ✓ Veiculos - exibe erro de validacao ao tentar salvar formulario vazio

  7 passed (8.3s)
```

Confirmado via API (`GET /api/dashboard`) que os dados criados pelos testes foram completamente removidos ao final, sem deixar resíduo no ambiente.

### 5.6 Primeira execução real do pipeline de CI (GitHub Actions)

Depois do push do repositório, o workflow `.github/workflows/ci.yml` disparou automaticamente. A **primeira execução real** (run [`32536963465`](https://github.com/prmatos91/crm-carros-impar/actions/runs/32536963465)) pegou exatamente o bug descrito na seção 5.2.1 (`Backend` falhou, os outros dois jobs nem chegaram a rodar por causa do `needs:`). Depois da correção do `driver-class-name` (commit `6a40ff7`) e um novo push, a **segunda execução** (run [`32537163388`](https://github.com/prmatos91/crm-carros-impar/actions/runs/32537163388)) passou por completo:

```
✓ Frontend (Angular) in 28s
✓ Backend (Java / Spring Boot) in 1m5s
    [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 12.94 s -- in CrmCarrosPostgresIntegrationTest
    [INFO] BUILD SUCCESS
✓ Stack completa via Docker Compose + E2E (Playwright) in 2m36s
```

Confirmando, num ambiente completamente independente da máquina de desenvolvimento (runner Ubuntu do GitHub, Docker Engine padrão): os 20 testes do backend passam de verdade — **incluindo o teste contra PostgreSQL real via Testcontainers**, que nesse ambiente não precisou pular (ao contrário da máquina de desenvolvimento local, onde ele pula por causa da incompatibilidade documentada na seção 5.2); os testes do frontend passam; a imagem Docker builda; a stack completa sobe saudável; e os 7 testes E2E do Playwright passam contra a aplicação real rodando em containers. Esse foi o fechamento do ciclo completo de validação descrito neste documento — do primeiro `mvnw test` local até o pipeline de CI verde na infraestrutura real do GitHub.

## 6. Fase 3 — polimento visual (i18n, tema, autocomplete, coluna de ações)

Depois do repositório publicado, foi pedida uma rodada de polimento visual: paginação em português, correção de quebra de linha na coluna de ações, autocomplete de marca/modelo/cor no formulário de veículo, e um alternador de tema claro/escuro.

### 6.1 Bug real: `ThemeService` quebrando os testes existentes

Ao adicionar o `ThemeService` (acesso a `localStorage`/`window.matchMedia` no construtor, injetado no componente raiz `App`), rodar `npm test` quebrou 2 dos 11 testes que já existiam e passavam:

```
TypeError: Cannot read properties of undefined (reading 'getItem')
  ❯ ThemeService.temaInicialEscuro src/app/core/services/theme.service.ts:21:32
```

**Causa**: o ambiente de testes (Vitest, não um navegador real) não fornece `localStorage` da mesma forma que um navegador — o `App.spec.ts` injeta `ThemeService` transitivamente (é usado no template do componente raiz), então qualquer teste que monta o `App` quebrava.

**Correção**: todo acesso a `localStorage`, `window` e `document` no `ThemeService` foi reescrito para ser defensivo (`typeof x !== 'undefined'`, com `try/catch` no acesso ao `localStorage`), em vez de assumir que esses globals sempre existem. Depois da correção:

```
Test Files  4 passed (4)
     Tests  11 passed (11)
```

Esse é exatamente o tipo de coisa que só aparece rodando os testes de verdade depois de qualquer mudança — sem rodar `npm test` neste momento, esse bug teria ido para o commit.

### 6.2 Verificação manual das melhorias

Depois do rebuild da stack via Docker, cada item foi conferido visualmente no navegador (não só assumido a partir do código):

- Paginação: "Itens por página", "Próxima página" etc. em português, e o intervalo mostrado como "1 – 8 de 8" nas 3 listagens.
- Coluna de Ações: os 3 ícones (visualizar/editar/excluir) permanecem numa única linha, sem quebra.
- Autocomplete de veículo: digitar "Toy" no campo Marca filtra para "Toyota"; selecionar "Toyota" faz o campo Modelo carregar só "Corolla" (o único modelo dessa marca no seed) — confirmando a cascata marca → modelo funcionando contra a API real (`GET /api/veiculos/modelos?marca=Toyota`).
- Tema: o botão no canto superior direito alterna toda a interface entre claro e escuro instantaneamente, com o ícone e o tooltip mudando de acordo ("Mudar para modo escuro" / "Mudar para modo claro"); a preferência sobrevive a navegação entre páginas.
- Diagrama Mermaid do `AGENT_GUIDE.md`: a primeira versão (com aspas aninhadas dentro de um node em formato cilindro) não renderizou no GitHub, ficando como bloco de código cru — sintaxe simplificada e confirmada renderizando corretamente via inspeção do DOM real da página no GitHub (o elemento de destino passou a conter um `<iframe>` para `viewscreen.githubusercontent.com/markdown/mermaid`, o serviço oficial do GitHub para isso) e depois visualmente pelo usuário.

Testes automatizados re-executados depois de todas as mudanças desta seção: backend 18/18, frontend 11/11, Playwright 7/7 — todos passando, sem regressão nos fluxos existentes (o formulário de veículo mudou de inputs de texto simples para autocomplete, mas os testes E2E que usam `.fill()` continuaram funcionando sem alteração, já que o autocomplete aceita texto livre).

## 7. Resumo geral

| Suíte | Execuções até passar | Falhas reais encontradas |
|---|---|---|
| Backend `mvnw test` (Fase 1) | 1ª após corrigir versão do Spring Boot no build | versão incorreta do parent POM |
| Frontend `ng build` (Fase 1) | 2 | dependência de animações ausente; tipagem `any` em `*matCellDef` |
| Frontend `ng test` (Fase 1) | 2 | matchers Jasmine incompatíveis com Vitest |
| `docker compose up --build` (Fase 1) | 2 | healthcheck do frontend usando `localhost` (resolvia para IPv6, Nginx só escutava IPv4) |
| Verificação manual browser (Fase 1) | 1 rodada, 1 bug encontrado | locale de formatação de moeda/número |
| Auditoria manual da API (Fase 2) | 1 rodada, 4 bugs encontrados | 500 em id invalido; sem log de erro; sem headers de seguranca; race condition no e-mail |
| Testcontainers (Fase 2) | Pula localmente (ambiente), passa no CI | incompatibilidade Docker Desktop 29.x × Testcontainers 1.21.3 (local); driver do datasource nao sobrescrito (só apareceu no CI) |
| Playwright E2E (Fase 2) | 3 | build desatualizado no container; seletor `.last()` ambiguo; paginacao escondendo registro criado |
| Pipeline de CI real (GitHub Actions) | 2 | job do backend falhando por causa do bug do driver do Testcontainers (só visível ali) |
| Polimento visual - `npm test` (Fase 3) | 2 | `ThemeService` acessando `localStorage`/`window` sem guarda, quebrando testes existentes |

Todas as falhas listadas foram reais (não simuladas), encontradas ao executar os comandos durante o desenvolvimento assistido por IA, e corrigidas antes da entrega — inclusive uma que só foi possível encontrar rodando o pipeline de CI de verdade, depois do push.
