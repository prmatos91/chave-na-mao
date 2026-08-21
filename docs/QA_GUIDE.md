# Guia de Quality Assurance para Execução Agentificável

> Este documento orienta um agente de IA (ou uma pessoa) sobre **como validar** este projeto: quais testes existem, como rodá-los, o que cada um garante, e o que ainda precisa de verificação manual. Se você é um agente recebendo a tarefa "valide se o projeto está funcionando" ou "rode os testes e corrija o que falhar", comece por aqui.

## 1. Estratégia de testes

O projeto usa uma pirâmide de testes enxuta, dimensionada para o escopo de um CRM de porte médio:

| Camada | Onde | Ferramenta | O que garante |
|---|---|---|---|
| Unitário (services) | `backend/src/test/java/.../*ServiceTest.java` | JUnit 5 + Mockito | Regras de negócio isoladas (validação, exclusão com vínculo, regra de venda automática) sem depender de banco |
| Contexto/integração | `backend/src/test/java/.../CrmCarrosBackendApplicationTests.java` | Spring Boot Test + H2 (modo PostgreSQL) | O contexto Spring sobe, as migrations Flyway aplicam com sucesso, e as entidades JPA batem com o schema migrado |
| Unitário (componentes/serviços) | `frontend/src/app/**/*.spec.ts` | Vitest (via `@angular/build:unit-test`) + Angular TestBed | Validação de formulários reativos, montagem de requisições HTTP, renderização condicional de dados |
| Build/compilação | `mvnw clean package` / `ng build` | Maven / esbuild | Ausência de erros de tipo/compilação em todo o projeto |
| End-to-end manual | Docker Compose + navegador | — | Fluxo completo real: subir os 3 containers, migrations+seed automáticos, CRUD nas 3 entidades pela UI, dashboard refletindo os dados, responsividade |

Não há suíte de E2E automatizada (Cypress/Playwright) neste projeto — é uma limitação de escopo assumida diante do prazo do desafio, compensada pela verificação manual completa registrada em [TEST_EXECUTION_LOG.md](TEST_EXECUTION_LOG.md). Se for adicionar E2E automatizado no futuro, veja a sugestão em [NOTES.md](../NOTES.md).

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
docker compose up --build
# depois docker compose ps para conferir que os 3 servicos ficaram "healthy"
```

Um agente validando o projeto do zero deve rodar, nesta ordem: `mvnw test` → `ng build` (ou `npm test`) → `docker compose up --build`. Se qualquer um falhar, **pare e corrija antes de prosseguir** para o próximo — os passos posteriores dependem dos anteriores estarem corretos.

## 3. Checklist requisito → verificação

| Requisito do desafio | Como é verificado |
|---|---|
| Cadastro de veículos (marca, modelo, ano, preço, cor, km, status) | `VeiculoServiceTest` + `veiculo-form.spec.ts` + verificação manual da tela `/veiculos/novo` |
| Cadastro de clientes (nome, e-mail, telefone, interesse) | `ClienteServiceTest` + verificação manual da tela `/clientes/novo` |
| Gestão de oportunidades (cliente+veículo, status, valor, observações) | `OportunidadeServiceTest` + verificação manual da tela `/oportunidades/novo`, incluindo a regra de auto-atualização do veículo para `VENDIDO` |
| Consulta e filtros nas 3 entidades | Verificação manual: filtro por status/interesse + busca textual nas listagens; filtro por cliente/veículo em oportunidades |
| Persistência em PostgreSQL | `CrmCarrosBackendApplicationTests` (valida schema) + verificação manual via `docker compose up` com Postgres real + `docker compose down`/`up` confirmando que os dados persistem no volume |
| Segurança mínima (validação, erros, env vars) | `GlobalExceptionHandler` coberto indiretamente pelos testes de service (exceções lançadas); variáveis sensíveis nunca hardcoded (ver `.env.example`); CORS restrito por env var |
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

## 5. Roteiro de verificação manual das 8 telas mínimas

Depois de `docker compose up --build`, com o frontend em http://localhost:4200:

1. **Dashboard** (`/dashboard`): confere totais e resumo por status.
2. **Veículos** (`/veiculos`): lista, filtro por status, busca por texto, paginação.
3. **Cadastro/edição de veículo** (`/veiculos/novo`, `/veiculos/:id/editar`): validação de campo obrigatório (tentar salvar vazio) e salvamento com sucesso.
4. **Clientes** (`/clientes`): lista, filtro por interesse, busca por texto.
5. **Cadastro/edição de cliente** (`/clientes/novo`, `/clientes/:id/editar`): validação de e-mail inválido e e-mail duplicado.
6. **Oportunidades** (`/oportunidades`): lista, filtro por status/cliente/veículo.
7. **Cadastro/edição de oportunidade** (`/oportunidades/novo`, `/oportunidades/:id/editar`): seleção de cliente e veículo, mudança de status.
8. **Detalhes** (ícone de "olho" em qualquer listagem): abre modal com os dados completos do registro.

Em cada tela, confirmar também: exclusão pede confirmação (`ConfirmDialog`) antes de efetivar, e o resultado da operação aparece como um snackbar (verde para sucesso, vermelho para erro).

## 6. Definição de pronto (Definition of Done)

Uma mudança neste projeto está pronta quando:

1. `./mvnw test` (backend) passa sem falhas.
2. `npm test` (frontend) passa sem falhas.
3. `ng build` (frontend) e `mvnw clean package` (backend) completam sem erro.
4. `docker compose up --build` sobe os 3 serviços como `healthy`.
5. Se a mudança afeta uma tela, ela foi verificada manualmente no navegador (não apenas nos testes automatizados).
6. Se a mudança afeta o schema, existe uma nova migration Flyway (nunca editar uma já existente).
7. Documentação relevante (`AGENT_GUIDE.md`, este arquivo, ou `NOTES.md`) foi atualizada se a mudança introduziu uma nova regra de negócio, premissa ou limitação.

## 7. Limitações conhecidas da estratégia de testes

- Testes de integração do backend rodam contra **H2 em modo PostgreSQL**, não contra um PostgreSQL real — suficiente para validar mapeamento JPA/migrations, mas não cobre features específicas do Postgres (ex.: comportamento exato de tipos numéricos em casos extremos). A verificação com Postgres real acontece na camada de verificação manual via Docker Compose.
- Não há testes automatizados de ponta a ponta (E2E) via navegador — a cobertura dessa camada é manual, registrada em [TEST_EXECUTION_LOG.md](TEST_EXECUTION_LOG.md).
- Cobertura de frontend é focada em formulários e serviços HTTP; componentes puramente visuais (listagens, diálogos de detalhe) não têm testes unitários dedicados, sendo cobertos pela verificação manual.
