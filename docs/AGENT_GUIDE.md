# Guia Semântico para Agentes de IA

> Este documento existe para que um agente de IA (ou uma pessoa nova no time) entenda o sistema, o domínio e as convenções do projeto **sem precisar ler todo o código antes de fazer a primeira alteração**. Se você é um agente recebendo uma tarefa neste repositório, leia este documento inteiro antes de editar qualquer arquivo.

## 1. O que este sistema é

Um CRM (Customer Relationship Management) para uma revenda de veículos. Existem três entidades de negócio centrais e um dashboard agregador:

- **Veículo**: um carro no estoque da revenda.
- **Cliente**: uma pessoa interessada em comprar um carro.
- **Oportunidade**: o vínculo entre um Cliente e um Veículo representando uma negociação de venda em andamento (ou já concluída/perdida).

Não há autenticação/login no escopo atual — é um sistema de uso interno de uma única revenda, sem multi-tenant e sem controle de usuários. Isso é uma premissa assumida (ver [NOTES.md](../NOTES.md)), não um requisito do desafio.

### Arquitetura em alto nível

```mermaid
flowchart LR
    UI["Angular SPA<br/>Angular Material"]

    subgraph compose["Docker Compose"]
        FE["frontend Nginx<br/>porta 4200"]
        BE["backend Spring Boot<br/>porta 8080"]
        DB[(PostgreSQL 16)]
    end

    UI -->|"HTTP/JSON via env.js"| FE
    UI -->|"REST /api/**"| BE
    BE -->|JDBC| DB
    BE -.->|"Flyway migrations + seed"| DB
```

O navegador do usuário fala diretamente com o backend (porta 8080 exposta no host) — o Nginx do frontend só serve os arquivos estáticos do Angular, não faz proxy de API. Ver a decisão de configuração de `API_URL` na seção 3.

## 2. Modelo de domínio e regras de negócio

```mermaid
erDiagram
    CLIENTE ||--o{ OPORTUNIDADE : possui
    VEICULO ||--o{ OPORTUNIDADE : possui

    CLIENTE {
        bigint id PK
        string nome
        string email UK
        string telefone
        enum interesse_principal
    }
    VEICULO {
        bigint id PK
        string marca
        string modelo
        int ano
        numeric preco
        string cor
        int quilometragem
        enum status
    }
    OPORTUNIDADE {
        bigint id PK
        bigint cliente_id FK
        bigint veiculo_id FK
        enum status
        numeric valor_proposto
        text observacoes
    }

    OPORTUNIDADE ||--o{ OPORTUNIDADE_HISTORICO : possui
    OPORTUNIDADE_HISTORICO {
        bigint id PK
        bigint oportunidade_id FK
        enum status_anterior
        enum status_novo
        timestamp alterado_em
    }
```

### Veículo (`backend/.../veiculo`)

| Campo | Tipo | Regra |
|---|---|---|
| marca, modelo, cor | texto | obrigatórios |
| ano | inteiro | obrigatório, ≥ 1950 |
| preco | decimal | obrigatório, > 0 |
| quilometragem | inteiro | obrigatório, ≥ 0 |
| status | enum | `DISPONIVEL`, `RESERVADO`, `VENDIDO` — default `DISPONIVEL` |

**Regra de negócio importante**: o status de um veículo pode ser alterado automaticamente pelo sistema (ver Oportunidade abaixo), não apenas manualmente pelo usuário.

Um veículo **não pode ser excluído** se tiver alguma Oportunidade associada (o banco impõe isso via `ON DELETE RESTRICT` na FK; o backend traduz a violação em um erro 409 amigável — ver `VeiculoService.excluir`).

Além do CRUD, existem 3 endpoints de apoio à UX do formulário (`GET /api/veiculos/marcas`, `GET /api/veiculos/modelos?marca=X`, `GET /api/veiculos/cores`) que retornam os valores distintos já cadastrados, usados para alimentar autocomplete no frontend (marca → filtra modelo em cascata). Eles não impõem uma lista fechada — o campo continua aceitando texto livre, é só uma sugestão a partir do que já existe no banco.

### Cliente (`backend/.../cliente`)

| Campo | Tipo | Regra |
|---|---|---|
| nome, telefone | texto | obrigatórios |
| email | texto | obrigatório, formato válido, **único** no sistema |
| interessePrincipal | enum | `SUV`, `HATCH`, `SEDAN`, `UTILITARIO`, `USADO`, `ZERO` |

O e-mail é validado como único tanto pela aplicação (`ClienteService.validarEmailDisponivel`, para dar uma mensagem de erro clara) quanto pelo banco (constraint `UNIQUE`, como rede de segurança contra condições de corrida). Um cliente **não pode ser excluído** se tiver oportunidades associadas, pelo mesmo motivo do veículo.

### Oportunidade (`backend/.../oportunidade`)

| Campo | Tipo | Regra |
|---|---|---|
| cliente, veiculo | referência | obrigatórios, devem existir |
| status | enum | `NOVO_LEAD`, `EM_NEGOCIACAO`, `PROPOSTA_ENVIADA`, `VENDIDO`, `PERDIDO` — default `NOVO_LEAD` |
| valorProposto | decimal | opcional, ≥ 0 quando informado |
| observacoes | texto livre | opcional, até 2000 caracteres |

**Regra de negócio central do sistema** (`OportunidadeService.aplicarEfeitoColateralDeVenda`): quando uma oportunidade é criada ou atualizada com status `VENDIDO`, o veículo associado é **automaticamente marcado como `VENDIDO`** no mesmo fluxo, refletindo a baixa no estoque. Essa é uma premissa de negócio assumida pelo desenvolvedor (não estava explicitada no desafio) e está documentada aqui de propósito — qualquer agente que for alterar o fluxo de oportunidades precisa saber que essa consequência existe e não deve ser removida sem uma decisão consciente. O inverso (voltar o veículo para `DISPONIVEL` se a oportunidade deixar de estar `VENDIDO`) **não** é implementado — é uma limitação conhecida, ver [NOTES.md](../NOTES.md).

Excluir uma oportunidade não tem efeitos colaterais sobre cliente/veículo (mas exclui em cascata o próprio histórico dela, via `ON DELETE CASCADE`).

### Histórico de status da oportunidade (`OportunidadeHistorico`)

Toda vez que uma oportunidade é criada, ou tem seu `status` alterado numa edição, uma entrada é gravada em `oportunidade_historico` (`status_anterior` nulo na criação, preenchido nas mudanças seguintes). É uma auditoria enxuta e deliberadamente escopada só ao status da oportunidade (o funil de vendas) — não é um audit log genérico de todos os campos de todas as entidades, o que seria escopo desproporcional ao pedido do desafio. Exposto via `GET /api/oportunidades/{id}/historico`, consumido pela timeline na tela de detalhe da oportunidade no frontend. Ver `OportunidadeService.registrarHistorico`.

## 3. Arquitetura

### Backend — `backend/src/main/java/com/impar/crmcarros/`

Organização por **feature/pacote de domínio** (não por camada técnica global): `veiculo/`, `cliente/`, `oportunidade/`, `dashboard/`, mais `common/` (exceções e DTOs compartilhados) e `config/` (CORS, OpenAPI).

Dentro de cada pacote de domínio, o padrão é sempre o mesmo:

```
<dominio>/
├── <Entidade>.java              # entidade JPA
├── <Entidade>Repository.java     # Spring Data JPA + JpaSpecificationExecutor
├── <Entidade>Specifications.java # specs reutilizáveis para filtros dinâmicos
├── <Entidade>Service.java        # regras de negocio, transacional
├── <Entidade>Controller.java     # REST, so orquestra request/response
├── <Entidade>Mapper.java         # conversao manual Entity <-> DTO
└── dto/
    ├── <Entidade>Request.java    # entrada (validada com Bean Validation)
    └── <Entidade>Response.java   # saida
```

Ao adicionar um novo campo ou uma nova entidade, siga exatamente esse padrão — é o que o restante do código (e os testes) espera.

Por que DTOs separados da entidade e mapeamento manual (sem MapStruct)? Para manter o projeto sem dependências extras de geração de código, dado o escopo do desafio; ficou explícito e fácil de auditar. Isso é uma escolha deliberada, não uma omissão.

**Tratamento de erros**: centralizado em `common/exception/GlobalExceptionHandler.java`. Toda exceção de negócio deve estender `BusinessRuleException` (mapeada para 409) ou usar `ResourceNotFoundException` (404). Erros de tipo/formato de parâmetro (`MethodArgumentTypeMismatchException`, `HttpMessageNotReadableException`) viram 400, nunca 500 — um id não numérico na URL, por exemplo, é erro do cliente, não do servidor. Nunca deixe uma exceção "vazar" sem handler — o objetivo é nunca expor stack trace ou detalhes internos ao cliente (requisito de segurança mínima do desafio), mas todo erro 5xx é logado no servidor (`log.error`) antes de responder, para não perder rastreabilidade.

**Segurança HTTP**: `config/SecurityHeadersFilter.java` adiciona `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy` em toda resposta da API (o Nginx do frontend faz o mesmo para os arquivos estáticos, em `frontend/docker/nginx.conf`). Se adicionar Spring Security no futuro, esses headers passam a ser responsabilidade dele — remova o filtro manual para não duplicar.

**Migrations**: Flyway, arquivos versionados em `src/main/resources/db/migration`. Uma alteração de schema = um novo arquivo `V<n>__descricao.sql`. Nunca edite uma migration já aplicada — crie uma nova.

**Testes**: Mockito para os services (sem subir contexto Spring, rápido). O teste de contexto (`CrmCarrosBackendApplicationTests`) sobe o Spring Boot inteiro contra **H2 em modo PostgreSQL** (`src/test/resources/application.yml`), rodando as mesmas migrations Flyway do ambiente real — isso valida que as entidades JPA batem com o schema migrado. H2 foi escolhido para os testes automatizados não dependerem de Docker/Postgres rodando; é uma aproximação, não uma garantia 100% idêntica ao Postgres real. Para fechar essa lacuna, existe também `CrmCarrosPostgresIntegrationTest`, que sobe um PostgreSQL real via **Testcontainers** e roda/passa de verdade no CI (confirmado, `docs/TEST_EXECUTION_LOG.md` seção 5.6). Ele pula a si mesmo de forma limpa (`Assumptions`) se o Docker não estiver acessível ao Testcontainers no ambiente (aconteceu de verdade em uma máquina de desenvolvimento com Docker Desktop muito recente; ver seção 5.2), então não trate um "0 tests run" nessa classe como falha — confira se é um skip por indisponibilidade de Docker antes de investigar mais.

### Frontend — `frontend/src/app/`

```
app/
├── core/
│   ├── models/        # interfaces TS espelhando os DTOs do backend
│   ├── services/       # um HttpClient service por entidade + dashboard + runtime config + notification
│   └── interceptors/    # error.interceptor.ts: toda falha HTTP vira um snackbar de erro
├── shared/
│   ├── components/confirm-dialog/  # unico uso restante de MatDialog: confirmacao antes de excluir
│   └── utils/labels.ts              # mapas enum -> label em portugues e enum -> classe CSS de cor
└── features/
    ├── dashboard/
    ├── veiculos/{veiculo-list,veiculo-form,veiculo-detail}/
    ├── clientes/{cliente-list,cliente-form,cliente-detail}/
    └── oportunidades/{oportunidade-list,oportunidade-form,oportunidade-detail}/
```

Padrão de feature: `standalone components`, roteamento lazy-loaded (`app.routes.ts`), Reactive Forms, Angular Material. Toda listagem tem: filtro + paginação (`MatPaginator`) + tabela (`MatTable`) + ação de visualizar (navega para `*-detail`, uma **rota própria**, ex. `/veiculos/:id`) + editar (navega para `*-form`) + excluir (abre `ConfirmDialog` antes).

**Por que os detalhes viraram rota própria e não ficaram em modal?** O desafio permite explicitamente as duas abordagens ("pode ser feita em uma tela específica, modal, drawer..."). A primeira versão usava modal (menos rotas, mantém o contexto da listagem); depois trocada para rota própria por decisão consciente de UX/arquitetura — permite link direto para um registro, funciona com o botão voltar do navegador, e a tela de detalhe da oportunidade precisava de espaço para a timeline de histórico, que não cabia bem num modal. Ao adicionar uma nova entidade, siga o padrão de rota própria (`<entidade>-detail/`), não modal.

**Configuração de API em runtime**: o frontend é buildado uma única vez e a URL da API é injetada em runtime via `frontend/public/env.js` (dev) ou gerado dinamicamente pelo entrypoint do container Nginx a partir da variável `API_URL` (produção/Docker) — ver `frontend/docker/docker-entrypoint.sh`. Nunca hardcode a URL da API em um service; sempre use `RuntimeConfigService`.

**Locale**: a aplicação inteira usa `LOCALE_ID = 'pt-BR'` (registrado em `app.config.ts`), então os pipes `currency`/`number`/`date` já formatam em português/BRL por padrão sem precisar passar locale manualmente em cada uso. O `MatPaginatorIntl` também é sobrescrito globalmente (`core/services/paginator-intl-pt-br.ts`) para traduzir os textos do paginador ("Itens por página", etc.) — qualquer tela nova com `MatPaginator` já herda a tradução automaticamente, não precisa configurar nada por componente.

**Tema claro/escuro**: `core/services/theme.service.ts` alterna uma classe `dark-theme` no `<html>`, e `styles.scss` define dois blocos `@include mat.theme(...)` (um com `theme-type: light`, outro com `theme-type: dark`) usando a mesma paleta — é assim que o Angular Material 3 troca de tema sem duplicar CSS customizado, já que todos os componentes (e os estilos globais que usam `--mat-sys-*`) reagem à troca de classe automaticamente. A preferência do usuário é persistida em `localStorage` (com fallback para `prefers-color-scheme` do sistema na primeira visita) — o acesso a `localStorage`/`window`/`document` é sempre defensivo (`typeof x !== 'undefined'`) porque o ambiente de teste (Vitest) não fornece esses globals da mesma forma que um navegador real; isso já causou uma falha de teste real, ver `docs/TEST_EXECUTION_LOG.md`.

**Testes E2E**: `frontend/e2e/*.spec.ts` (Playwright), rodam contra a stack real via Docker Compose (não contra `ng serve`/mocks) — cobrem os fluxos de CRUD completo e a regra de negócio de venda. Ao adicionar uma tela ou fluxo novo relevante, adicione um teste E2E cobrindo o caminho feliz; ver `docs/QA_GUIDE.md` para o comando de execução.

**Limitação de tipagem conhecida**: nas tabelas (`MatTable`), o parâmetro de `*matCellDef="let row"` não é inferido como o tipo genérico da linha nesta versão do Angular Material (fica `any`), então indexar um `Record<Enum, string>` diretamente no template causa erro de compilação (`TS7053`). A solução adotada em todo o projeto é expor métodos tipados no componente (`statusLabel(status)`, `statusClass(status)`) e chamá-los do template em vez de indexar o Record diretamente. Siga esse padrão em qualquer tabela nova.

## 4. Como estender o sistema

**Adicionar um campo a uma entidade existente** (ex.: adicionar "placa" ao Veículo):
1. Nova migration `V3__add_placa_veiculo.sql` no backend.
2. Adicionar o campo em `Veiculo.java`, `VeiculoRequest.java`, `VeiculoResponse.java`, `VeiculoMapper.java`.
3. Adicionar o campo em `veiculo.model.ts` (`Veiculo` e `VeiculoRequest`).
4. Adicionar o campo no formulário (`veiculo-form.ts`/`.html`) e, se fizer sentido, na listagem e na página de detalhe (`veiculo-detail/`).
5. Atualizar/adicionar testes de service (backend) e de formulário (frontend).

**Adicionar uma nova entidade**: replicar a estrutura de pacotes descrita na seção 3 (backend e frontend), adicionar a rota lazy em `app.routes.ts`, adicionar o link no menu (`app.ts`/`app.html`), e uma migration para a tabela nova.

**Adicionar uma nova regra de negócio com efeito colateral entre entidades** (como a de Oportunidade → Veículo): implemente no `Service` da entidade "gatilho", nunca no controller, e documente a regra tanto em um comentário no código quanto neste arquivo (seção 2) — regras de negócio implícitas são a maior fonte de bugs de regressão em CRMs.

## 5. Premissas assumidas

Ver a lista completa e o racional em [NOTES.md](../NOTES.md). As mais relevantes para quem for mexer no código:

- Sem autenticação/autorização (fora do escopo mínimo do desafio; decisão consciente, ver NOTES.md).
- Um veículo pode ter várias oportunidades ao longo do tempo (histórico de negociações), mesmo depois de vendido — o sistema não impede criar uma nova oportunidade para um veículo já `VENDIDO`; isso é intencional (ex.: renegociação), mas fica registrado aqui para não ser "corrigido" por engano.
- Preços e valores em Real (BRL), sem suporte a outras moedas.
- Auditoria (histórico) escopada apenas ao status da oportunidade — não é um audit log genérico de todas as entidades/campos.
