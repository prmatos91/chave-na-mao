# Guia de Quality Assurance para Execução Agentificável

> Este documento orienta um agente de IA (ou uma pessoa) sobre **como validar** este projeto: quais testes existem, como rodá-los, o que cada um garante, e o que ainda precisa de verificação manual. Se você é um agente recebendo a tarefa "valide se o projeto está funcionando" ou "rode os testes e corrija o que falhar", comece por aqui.

## 1. Estratégia de testes

O projeto usa uma pirâmide de testes enxuta, dimensionada para o escopo de um CRM de porte médio:

| Camada | Onde | Ferramenta | O que garante |
|---|---|---|---|
| Unitário (services) | `backend/src/test/java/.../*ServiceTest.java` | JUnit 5 + Mockito | Regras de negócio isoladas (validação, exclusão com vínculo, regra de venda automática, histórico de status) sem depender de banco |
| Contexto/integração | `backend/src/test/java/.../CrmCarrosBackendApplicationTests.java` | Spring Boot Test + H2 (modo PostgreSQL) | O contexto Spring sobe, as migrations Flyway aplicam com sucesso, e as entidades JPA batem com o schema migrado |
| Integração com Postgres real | `backend/src/test/java/.../CrmCarrosPostgresIntegrationTest.java` | Testcontainers | Migrations e mapeamento JPA contra um PostgreSQL real (não H2). Pula a si mesmo de forma limpa se o Docker não estiver acessível ao Testcontainers no ambiente — não é uma falha, ver seção 7 |
| Unitário (componentes/serviços) | `frontend/src/app/**/*.spec.ts` | Vitest (via `@angular/build:unit-test`) + Angular TestBed | Validação de formulários reativos, montagem de requisições HTTP, renderização condicional de dados |
| Build/compilação | `mvnw clean package` / `ng build` | Maven / esbuild | Ausência de erros de tipo/compilação em todo o projeto |
| End-to-end automatizado | `frontend/e2e/*.spec.ts` | Playwright, contra a stack real via Docker Compose | Fluxos de ouro completos pela UI real: CRUD de veículo e cliente, validações, e o fluxo de ponta a ponta da regra de negócio (oportunidade Vendido → veículo Vendido) |
| End-to-end manual | Docker Compose + navegador | — | Responsividade (mobile/desktop) e qualquer fluxo ainda não coberto pelo Playwright |

## 2. Comandos para rodar cada suíte

```bash
# Backend: testes unitarios + de contexto (usa H2 em memoria, nao precisa de Docker rodando)
cd backend && ./mvnw test

# Backend: build completo (equivalente ao que roda dentro do Dockerfile)
cd backend && ./mvnw clean package -DskipTests

# Frontend: testes unitarios
cd frontend && npm test
# (equivalente a "ng test"; roda uma vez e finaliza, sem watch mode)

# Frontend: build de producao (pega erros de tipo que so aparecem em build)
cd frontend && npm run build

# Stack completa dockerizada, de ponta a ponta
docker compose up --build -d
# depois docker compose ps para conferir que os 3 servicos ficaram "healthy"

# Frontend: testes E2E (Playwright) - precisa da stack acima rodando
cd frontend
npx playwright install --with-deps chromium   # so na primeira vez
npm run e2e
```

Um agente validando o projeto do zero deve rodar, nesta ordem: `mvnw test` → `ng build`/`npm test` → `docker compose up --build` → `npm run e2e`. Se qualquer um falhar, **pare e corrija antes de prosseguir** para o próximo — os passos posteriores dependem dos anteriores estarem corretos. Exceção: se `CrmCarrosPostgresIntegrationTest` reportar "0 tests run" (skip por Docker indisponível ao Testcontainers), isso **não** bloqueia o fluxo — os demais testes do backend continuam garantindo a suíte.

## 3. Checklist requisito → verificação

| Requisito do desafio | Como é verificado |
|---|---|
| Cadastro de veículos (marca, modelo, ano, preço, cor, km, status) | `VeiculoServiceTest` + `veiculo-form.spec.ts` + verificação manual da tela `/veiculos/novo` |
| Cadastro de clientes (nome, e-mail, telefone, interesse) | `ClienteServiceTest` + verificação manual da tela `/clientes/novo` |
| Gestão de oportunidades (cliente+veículo, status, valor, observações) | `OportunidadeServiceTest` + `e2e/oportunidade.spec.ts` (cobre a regra de auto-atualização do veículo para `VENDIDO` de ponta a ponta pela UI real) |
| Consulta e filtros nas 3 entidades | Verificação manual: filtro por status/interesse + busca textual nas listagens; filtro por cliente/veículo em oportunidades |
| Persistência em PostgreSQL | `CrmCarrosBackendApplicationTests` (valida schema) + verificação manual via `docker compose up` com Postgres real + `docker compose down`/`up` confirmando que os dados persistem no volume |
| Segurança mínima (validação, erros, env vars) | `GlobalExceptionHandler` (incluindo 400 em parâmetro inválido, nunca 500) coberto por `VeiculoControllerWebTest`; variáveis sensíveis nunca hardcoded (ver `.env.example`); CORS restrito por env var (testado manualmente com origem não autorizada → 403); headers de segurança HTTP (`SecurityHeadersFilter` no backend, `add_header` no Nginx do frontend) |
| Dashboard com indicadores | Verificação manual da tela `/dashboard` comparando os números exibidos com o retorno de `GET /api/dashboard` |
| 8 telas mínimas | Verificação manual, ver seção 5 |
| Dockerização completa | `docker compose up --build` com os 3 serviços subindo saudáveis (`docker compose ps`) |
| Responsividade | Verificação manual redimensionando o navegador para largura mobile (375px) e desktop (1280px) |

## 4. Regras de validação por entidade (para gerar casos de teste)

### Veículo
- `marca`, `modelo`, `cor`: obrigatórios, não podem ser vazios/só espaço.
- `ano`: obrigatório, inteiro ≥ 1950.
- `preco`: obrigatório, decimal > 0 (zero ou negativo deve falhar).
- `quilometragem`: obrigatório, inteiro ≥ 0.
- `status`: obrigatório, um dos valores do enum (`DISPONIVEL`, `RESERVADO`, `VENDIDO`).
- Exclusão deve falhar com 409 se houver oportunidade vinculada.

### Cliente
- `nome`, `telefone`: obrigatórios.
- `email`: obrigatório, formato de e-mail válido, único (criar dois clientes com o mesmo e-mail deve falhar com 409 no segundo).
- `interessePrincipal`: obrigatório, um dos valores do enum.
- Exclusão deve falhar com 409 se houver oportunidade vinculada.

### Oportunidade
- `clienteId`, `veiculoId`: obrigatórios, devem apontar para registros existentes (404 se não existirem).
- `status`: obrigatório, um dos valores do enum.
- `valorProposto`: opcional; se informado, deve ser ≥ 0.
- `observacoes`: opcional, até 2000 caracteres.
- Criar/editar uma oportunidade com `status = VENDIDO` deve resultar no veículo associado com `status = VENDIDO` (verificar via `GET /api/veiculos/{id}` depois).
- Criar uma oportunidade deve gerar uma entrada em `GET /api/oportunidades/{id}/historico` com `statusAnterior = null`; mudar o `status` numa edição deve gerar uma nova entrada; editar sem mudar o `status` **não** deve gerar entrada nova.

## 5. Roteiro de verificação manual das 8 telas mínimas

Depois de `docker compose up --build`, com o frontend em http://localhost:4200:

1. **Dashboard** (`/dashboard`): confere totais e resumo por status.
2. **Veículos** (`/veiculos`): lista, filtro por status, busca por texto, paginação.
3. **Cadastro/edição de veículo** (`/veiculos/novo`, `/veiculos/:id/editar`): validação de campo obrigatório (tentar salvar vazio) e salvamento com sucesso.
4. **Clientes** (`/clientes`): lista, filtro por interesse, busca por texto.
5. **Cadastro/edição de cliente** (`/clientes/novo`, `/clientes/:id/editar`): validação de e-mail inválido e e-mail duplicado.
6. **Oportunidades** (`/oportunidades`): lista, filtro por status/cliente/veículo.
7. **Cadastro/edição de oportunidade** (`/oportunidades/novo`, `/oportunidades/:id/editar`): seleção de cliente e veículo, mudança de status.
8. **Detalhes** (ícone de "olho" em qualquer listagem, navega para `/veiculos/:id`, `/clientes/:id` ou `/oportunidades/:id`): página própria com os dados completos do registro; no caso da oportunidade, inclui a timeline de histórico de status.

Em cada tela, confirmar também: exclusão pede confirmação (`ConfirmDialog`) antes de efetivar, e o resultado da operação aparece como um snackbar (verde para sucesso, vermelho para erro).

## 6. Definição de pronto (Definition of Done)

Uma mudança neste projeto está pronta quando:

1. `./mvnw test` (backend) passa sem falhas.
2. `npm test` (frontend) passa sem falhas.
3. `ng build` (frontend) e `mvnw clean package` (backend) completam sem erro.
4. `docker compose up --build` sobe os 3 serviços como `healthy`.
5. Se a mudança afeta um fluxo de tela coberto por `frontend/e2e/`, `npm run e2e` passa. Se afeta uma tela nova/não coberta, foi verificada manualmente no navegador.
6. Se a mudança afeta o schema, existe uma nova migration Flyway (nunca editar uma já existente).
7. Documentação relevante (`AGENT_GUIDE.md`, este arquivo, ou `NOTES.md`) foi atualizada se a mudança introduziu uma nova regra de negócio, premissa ou limitação.

## 7. Limitações conhecidas da estratégia de testes

- A suíte rápida do backend (`mvnw test` no dia a dia) roda contra **H2 em modo PostgreSQL**. A suíte que valida contra **PostgreSQL real** (`CrmCarrosPostgresIntegrationTest`, via Testcontainers) roda e passa de verdade no CI (confirmado, ver [TEST_EXECUTION_LOG.md](TEST_EXECUTION_LOG.md) seção 5.6), mas em pelo menos um ambiente de desenvolvimento observado (Docker Desktop muito recente) ela não conseguiu detectar o Docker disponível por uma incompatibilidade de baixo nível entre o Testcontainers e essa versão específica do Docker Desktop — o teste pula a si mesmo de forma limpa nesse caso (não falha o build). Ver o relato completo em [TEST_EXECUTION_LOG.md](TEST_EXECUTION_LOG.md) seções 5.2 e 5.6 antes de assumir que é um problema no código.
- Testes E2E automatizados (Playwright) cobrem os fluxos de ouro (golden paths) das 3 entidades e a regra de negócio principal — não cobrem exaustivamente toda combinação de filtro/paginação/borda; essas ficam com os testes unitários e a verificação manual.
- Cobertura unitária de frontend é focada em formulários e serviços HTTP; componentes puramente visuais (listagens, páginas de detalhe) não têm testes unitários dedicados — são cobertos pelos testes E2E e pela verificação manual.
