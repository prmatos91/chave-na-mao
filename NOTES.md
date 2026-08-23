# Observações Finais

## Premissas assumidas

O desafio deixa alguns pontos de negócio em aberto de propósito, pedindo que premissas sejam documentadas. As assumidas neste projeto:

- **Sem autenticação/login.** O escopo mínimo de telas do desafio não inclui uma tela de login, e "segurança mínima" foi interpretada como validação de entrada, tratamento de erros, headers HTTP de segurança, CORS restrito e uso de variáveis de ambiente — não como um sistema de contas de usuário. Essa decisão foi reavaliada de propósito durante o desenvolvimento (veio à tona explicitamente, não foi só uma omissão) e mantida: implementar autenticação de verdade (hash de senha, sessão/JWT, guards de rota, proteção de todos os endpoints) é escopo desproporcional ao que foi pedido e ao prazo disponível, com risco real de introduzir bugs numa parte do sistema que não é avaliada. Um CRM real precisaria disso — fica como melhoria futura, não como algo esquecido.
- **Uma revenda, um "tenant".** Não há conceito de múltiplas lojas/filiais.
- **Veículo pode ter várias oportunidades ao longo do tempo**, inclusive depois de vendido (ex.: uma renegociação, ou um erro de cadastro anterior). O sistema não bloqueia criar uma nova oportunidade para um veículo já `VENDIDO`.
- **Regra de negócio adicionada**: salvar uma oportunidade com status `VENDIDO` marca automaticamente o veículo associado como `VENDIDO`. Essa regra não estava no enunciado, mas foi considerada um comportamento esperado de qualquer CRM de venda de carros (evitar que o mesmo carro apareça como "disponível" depois de vendido). Documentada em detalhe em [docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md).
- **`RESERVADO` não tem a mesma automação que `VENDIDO`**: o campo Status do formulário de veículo permite escolher livremente entre Disponível/Reservado/Vendido — não há nenhuma restrição impedindo marcar um veículo como Vendido manualmente ali. A única automação existente é unidirecional e específica: salvar uma **oportunidade** com status `VENDIDO` marca o veículo associado como `VENDIDO` de tabela (`OportunidadeService`). Não existe o equivalente para `RESERVADO` — não há nenhuma regra ligando o status de uma oportunidade ao veículo ficar reservado, então um veículo pode estar `RESERVADO` sem ter nenhuma oportunidade vinculada, e isso é válido pelo sistema hoje. Como consequência, a seção "Clientes interessados" da tela de detalhe pode legitimamente aparecer vazia para um veículo reservado — isso é esperado, não um bug.

  Dito isso, a massa de dados de exemplo (`V2__seed.sql`/`V4__mais_massa_de_dados.sql`) tinha 4 veículos `RESERVADO` sem nenhuma oportunidade vinculada, o que não é realista pra uma demonstração (na prática, um veículo quase sempre fica reservado *por causa de* uma negociação em andamento). Corrigido com `V5__oportunidades_para_veiculos_reservados.sql`, adicionando uma oportunidade em negociação/proposta enviada para cada um. Isso foi uma correção de dado de exemplo, não uma mudança de regra de negócio.
- **Histórico de status da oportunidade, com escopo deliberadamente enxuto**: só o `status` da oportunidade é auditado (não um log genérico de todas as mudanças de todas as entidades), por ser o dado mais relevante de um funil de vendas e por manter o escopo proporcional ao pedido.
- **Moeda única (BRL)**, sem suporte a outras moedas ou internacionalização de conteúdo (a UI está em português, único idioma suportado).

## Decisões técnicas relevantes

- **Flyway em vez de `ddl-auto: update`**: schema versionado explicitamente, mais próximo de uma prática de produção real e mais fácil de auditar do que deixar o Hibernate gerar o schema.
- **DTOs + mapeamento manual, sem MapStruct**: menos uma dependência de geração de código para um projeto deste porte; o mapeamento fica explícito e fácil de ler.
- **H2 (modo PostgreSQL) para a suíte rápida de testes do backend, complementado por Testcontainers para um teste contra PostgreSQL real**: a suíte do dia a dia roda em milissegundos sem depender de Docker; o teste com Testcontainers fecha a lacuna de "isso funciona no banco de verdade?". Na prática, esse segundo teste esbarrou numa incompatibilidade real entre a versão do Testcontainers disponível e um Docker Desktop muito recente numa das máquinas de desenvolvimento usadas — o teste foi projetado para pular a si mesmo de forma limpa nesse cenário específico em vez de quebrar a build. Detalhes reais da investigação em [docs/TEST_EXECUTION_LOG.md](docs/TEST_EXECUTION_LOG.md) seção 5.2.
- **Detalhes em rota própria (`/entidade/:id`), não em modal**: a primeira versão usava modal (permitido explicitamente pelo enunciado); foi trocada por rota própria por decisão consciente — link direto para um registro, integração com o botão voltar do navegador, e espaço suficiente para a timeline de histórico da oportunidade, que não caberia bem num modal.
- **Playwright para os testes E2E, em vez de Cypress**: integra melhor com pipelines de CI modernos, é mais rápido para rodar localmente, e tem um modelo de auto-espera (`auto-waiting`) que reduz flakiness em UIs assíncronas como esta.
- **Configuração de API do frontend via `env.js` gerado em runtime pelo Nginx**, em vez dos `environment.ts` estáticos do Angular: permite trocar a URL da API sem rebuildar a imagem, o que é mais alinhado com "configuração por variáveis de ambiente" também no frontend (não só no backend).
- **Angular Material** como biblioteca de componentes: acelera a entrega de uma UI consistente e responsiva sem exigir CSS extensivo escrito à mão, dado o prazo do desafio.
- **Tema claro/escuro via Angular Material 3 nativo** (`theme-type: light`/`dark` no mesmo `mat.theme()`), não uma biblioteca de terceiros: a M3 já foi desenhada para isso, então trocar de tema é só alternar uma classe no `<html>` — sem duplicar variáveis CSS custom nem manter uma segunda paleta manualmente.
- **Autocomplete de marca/modelo/cor com texto livre, não uma lista fechada (`select`)**: sugere os valores já cadastrados (modelo filtra em cascata pela marca escolhida) mas nunca impede cadastrar uma marca/modelo/cor nova — uma revenda real recebe carros de marcas que ainda não tem no sistema, então travar o campo numa lista fixa seria um problema, não uma melhoria.

## Limitações conhecidas

- O teste de integração contra PostgreSQL real (Testcontainers) pode não rodar em ambientes de desenvolvimento com Docker Desktop muito recente (ver decisão técnica acima) — não afeta a suíte principal nem o comportamento da aplicação, só essa camada específica de teste nesse cenário específico. Deve funcionar normalmente em CI.
- A regra de auto-atualização do veículo para `VENDIDO` não tem o caminho inverso automático (mudar a oportunidade para outro status não devolve o veículo para `DISPONIVEL`) — é intencional para não desfazer uma venda concluída por engano, mas fica registrado como algo a discutir/ajustar caso o negócio real precise disso.
- Sem paginação "infinita"/virtualização nas listagens — usa paginação tradicional do Angular Material, suficiente para o volume de dados esperado de uma revenda de porte pequeno/médio. Os seletores de cliente/veículo nos formulários de oportunidade carregam até 200 registros de cada — suficiente para o volume de dados deste projeto, mas não uma solução de busca/autocomplete server-side, que seria necessária para um volume bem maior de dados.
- Sem rate limiting nem WAF na API — fora do escopo de "segurança mínima" interpretado para este desafio.

## Melhorias futuras (se o projeto continuasse)

- Autenticação (ex.: JWT) e um conceito básico de usuário/vendedor, permitindo atribuir oportunidades a um vendedor responsável.
- Caminho inverso da regra de venda automática (voltar veículo para `DISPONIVEL` em cenários específicos, com confirmação explícita do usuário).
- Busca com autocomplete server-side para os seletores de cliente/veículo, caso o volume de dados cresça além de algumas centenas de registros.
- Exportação de relatórios (CSV/PDF) a partir das listagens e do dashboard.
- Histórico/auditoria genérico para outras entidades além da oportunidade, caso o negócio real precise auditar também mudanças em veículos/clientes.
