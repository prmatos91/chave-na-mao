# Chave na Mão

[![CI](https://github.com/prmatos91/chave-na-mao/actions/workflows/ci.yml/badge.svg)](https://github.com/prmatos91/chave-na-mao/actions/workflows/ci.yml)

**Chave na Mão** é um CRM web para gestão de vendas de veículos: cadastro de veículos, clientes e oportunidades de venda, com dashboard de indicadores. Desenvolvido como teste técnico para o processo seletivo da Ímpar.

**Stack:** Angular 22 (standalone components + Angular Material) · Java 21 / Spring Boot 4 · PostgreSQL 16 · tudo orquestrado via Docker Compose.

Este README é o **manual de execução**. Para os demais documentos exigidos pelo desafio, veja:

- [docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md) — documentação semântica do domínio e da arquitetura, para orientar agentes de IA que forem evoluir o projeto.
- [docs/QA_GUIDE.md](docs/QA_GUIDE.md) — estratégia de qualidade e como um agente de IA deve rodar/validar os testes.
- [docs/TEST_EXECUTION_LOG.md](docs/TEST_EXECUTION_LOG.md) — registro real das execuções de teste feitas com apoio de IA durante o desenvolvimento.
- [NOTES.md](NOTES.md) — premissas assumidas, decisões técnicas e limitações conhecidas.
- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) — reconstrução sanitizada do prompt de kickoff do projeto, como exemplo de engenharia de prompt.

## Pré-requisitos

Apenas **Docker** e **Docker Compose** precisam estar instalados na máquina do avaliador. Não é necessário instalar Java, Node/Angular ou PostgreSQL localmente — tudo roda em containers.

- Docker Desktop (ou Docker Engine) 24+
- Docker Compose v2 (`docker compose`, já incluso no Docker Desktop)

## Como executar

```bash
git clone <url-do-repositorio>
cd chave-na-mao
cp .env.example .env
docker compose up --build
```

O primeiro `up --build` demora alguns minutos (build das imagens de backend e frontend). Ao final, três containers estarão de pé: `db`, `backend` e `frontend`.

Assim que o backend ficar saudável, ele aplica automaticamente as **migrations Flyway** (criação das tabelas) e a **carga inicial de dados (seed)** — não é necessário rodar nenhum comando adicional.

### Acessando a aplicação

| Serviço | URL |
|---|---|
| Frontend (CRM) | http://localhost:4200 |
| Backend (API REST) | http://localhost:8080/api |
| Swagger / OpenAPI | http://localhost:8080/swagger-ui.html |
| Health check do backend | http://localhost:8080/actuator/health |

### Parar o ambiente

```bash
docker compose down
```

Os dados do PostgreSQL ficam persistidos em um volume Docker nomeado (`chave-na-mao_postgres_data`) e sobrevivem a `docker compose down`. Para resetar o banco do zero (reaplicar migrations e seed):

```bash
docker compose down -v
docker compose up --build
```

## Variáveis de ambiente

Configuração via `.env` (veja [.env.example](.env.example) para a lista completa e comentada). Nenhum segredo real está commitado no repositório.

| Variável | Descrição | Default |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciais do PostgreSQL | `crm_carros` / `crm_carros` / `change_me` |
| `BACKEND_PORT` | Porta do backend exposta no host | `8080` |
| `CORS_ALLOWED_ORIGINS` | Origem permitida pelo CORS do backend | `http://localhost:4200` |
| `FRONTEND_PORT` | Porta do frontend exposta no host | `4200` |
| `API_URL` | URL da API usada pelo **navegador** (não é a rede interna do Docker) | `http://localhost:8080` |

> Se você mudar `BACKEND_PORT` ou `FRONTEND_PORT`, lembre de atualizar `API_URL` e `CORS_ALLOWED_ORIGINS` no `.env` de acordo, para que frontend e backend continuem se enxergando.

## Banco de dados, migrations e seed

- ORM: Spring Data JPA / Hibernate (apenas para leitura/escrita — `ddl-auto: validate`, nunca gera schema automaticamente).
- Migrations versionadas com **Flyway**, em [backend/src/main/resources/db/migration](backend/src/main/resources/db/migration):
  - `V1__init.sql`: cria as tabelas `veiculo`, `cliente` e `oportunidade`.
  - `V2__seed.sql`: insere alguns registros de exemplo (8 veículos, 6 clientes, 6 oportunidades) para o dashboard e as listagens não nascerem vazios.
  - `V3__oportunidade_historico.sql`: cria a tabela de histórico de mudanças de status da oportunidade (ver seção de API abaixo).
- As migrations rodam automaticamente na subida do backend (`spring.flyway.enabled=true`), sem passo manual.

## Estrutura do repositório

```
.
├── backend/            # API Spring Boot (Java 21)
├── frontend/           # SPA Angular (Angular Material)
│   └── e2e/             # Testes E2E (Playwright), rodam contra a stack real
├── .github/workflows/  # Pipeline de CI (GitHub Actions)
├── docker-compose.yml  # Orquestração dos 3 serviços (db, backend, frontend)
├── .env.example         # Template de variáveis de ambiente
└── docs/                 # Documentação para agentes de IA (dev e QA)
```

## Rodando localmente sem Docker (opcional, para desenvolvimento)

Só é necessário se você quiser desenvolver/depurar fora dos containers.

**Backend** (requer JDK 21):

```bash
cd backend
./mvnw spring-boot:run
```

Requer um PostgreSQL acessível em `localhost:5432` (pode ser o container `db` do compose, subindo só ele com `docker compose up -d db`), com as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` de acordo (veja [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml)).

**Frontend** (requer Node 20+):

```bash
cd frontend
npm install
npm start
```

Sobe em http://localhost:4200 apontando por padrão para `http://localhost:8080` (veja [frontend/public/env.js](frontend/public/env.js)).

### Rodando os testes

```bash
# Backend - testes unitarios + de contexto (H2, nao precisa de Docker)
cd backend && ./mvnw test

# Backend - inclui tambem um teste de integracao contra PostgreSQL real via
# Testcontainers, que roda automaticamente se o Docker estiver acessivel ao
# Testcontainers no seu ambiente (pula de forma limpa caso nao esteja - ver
# docs/TEST_EXECUTION_LOG.md secao 5.2 para um caso real desse cenario)

# Frontend - testes unitarios
cd frontend && npm test

# Frontend - testes E2E (Playwright), precisa da stack rodando via Docker Compose
docker compose up --build -d
cd frontend && npx playwright install --with-deps chromium   # so na primeira vez
npm run e2e
```

Ver [docs/QA_GUIDE.md](docs/QA_GUIDE.md) para a estratégia completa de testes e [docs/TEST_EXECUTION_LOG.md](docs/TEST_EXECUTION_LOG.md) para o resultado real dessas execuções durante o desenvolvimento. O pipeline de CI (`.github/workflows/ci.yml`) roda todas essas suítes automaticamente a cada push.

## Troubleshooting

- **Porta em uso (`address already in use`)**: outro processo já usa 4200, 8080 ou 5432. Ajuste `FRONTEND_PORT`/`BACKEND_PORT` no `.env` (a porta do Postgres não é exposta ao host, então não conflita).
- **`docker compose up` falha na primeira vez com erro de rede/DNS ao baixar imagens**: verifique a conexão com a internet; as imagens base (`postgres:16-alpine`, `node:22-alpine`, `eclipse-temurin`, `nginx:1.27-alpine`) precisam ser baixadas na primeira execução.
- **Frontend sobe mas não carrega dados**: confirme que `API_URL` no `.env` aponta para uma URL acessível pelo seu navegador (não `http://backend:8080`, que só existe na rede interna do Docker).
- **Quero recomeçar do zero**: `docker compose down -v` remove containers e o volume do banco.
- **O teste `CrmCarrosPostgresIntegrationTest` (Testcontainers) é pulado no meu ambiente**: alguns Docker Desktop muito recentes têm uma incompatibilidade conhecida com a checagem de disponibilidade do Testcontainers (detalhes reais em [docs/TEST_EXECUTION_LOG.md](docs/TEST_EXECUTION_LOG.md), seção 5.2). O teste detecta isso e pula de forma limpa em vez de quebrar a build; os demais testes do backend não são afetados.
