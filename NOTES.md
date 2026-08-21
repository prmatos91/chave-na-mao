# Observações Finais

## Premissas assumidas

O desafio deixa alguns pontos de negócio em aberto de propósito, pedindo que premissas sejam documentadas. As assumidas neste projeto:

- **Sem autenticação/login.** O escopo mínimo de telas do desafio não inclui uma tela de login, e "segurança mínima" foi interpretada como validação de entrada, tratamento de erros, CORS restrito e uso de variáveis de ambiente — não como um sistema de contas de usuário. Um CRM real precisaria disso, mas foi deixado fora para manter o foco no que foi pedido.
- **Uma revenda, um "tenant".** Não há conceito de múltiplas lojas/filiais.
- **Veículo pode ter várias oportunidades ao longo do tempo**, inclusive depois de vendido (ex.: uma renegociação, ou um erro de cadastro anterior). O sistema não bloqueia criar uma nova oportunidade para um veículo já `VENDIDO`.
- **Regra de negócio adicionada**: salvar uma oportunidade com status `VENDIDO` marca automaticamente o veículo associado como `VENDIDO`. Essa regra não estava no enunciado, mas foi considerada um comportamento esperado de qualquer CRM de venda de carros (evitar que o mesmo carro apareça como "disponível" depois de vendido). Documentada em detalhe em [docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md).
- **Moeda única (BRL)**, sem suporte a outras moedas ou internacionalização de conteúdo (a UI está em português, único idioma suportado).

## Decisões técnicas relevantes

- **Flyway em vez de `ddl-auto: update`**: schema versionado explicitamente, mais próximo de uma prática de produção real e mais fácil de auditar do que deixar o Hibernate gerar o schema.
- **DTOs + mapeamento manual, sem MapStruct**: menos uma dependência de geração de código para um projeto deste porte; o mapeamento fica explícito e fácil de ler.
- **H2 (modo PostgreSQL) nos testes automatizados do backend, não Testcontainers**: escolha consciente de simplicidade/velocidade dado o prazo — os testes rodam sem precisar de Docker ativo. O trade-off é não validar 100% do comportamento específico do PostgreSQL nos testes automatizados; a verificação com Postgres real acontece manualmente via `docker compose up`, registrada em [docs/TEST_EXECUTION_LOG.md](docs/TEST_EXECUTION_LOG.md).
- **Detalhes em modal, não em rota própria**: reduz a quantidade de telas/rotas mantendo o usuário no contexto da listagem; a opção era explicitamente permitida pelo enunciado.
- **Configuração de API do frontend via `env.js` gerado em runtime pelo Nginx**, em vez dos `environment.ts` estáticos do Angular: permite trocar a URL da API sem rebuildar a imagem, o que é mais alinhado com "configuração por variáveis de ambiente" também no frontend (não só no backend).
- **Angular Material** como biblioteca de componentes: acelera a entrega de uma UI consistente e responsiva sem exigir CSS extensivo escrito à mão, dado o prazo do desafio.

## Limitações conhecidas

- Sem testes E2E automatizados via navegador (Cypress/Playwright) — a cobertura dessa camada é manual (ver [docs/TEST_EXECUTION_LOG.md](docs/TEST_EXECUTION_LOG.md)).
- A regra de auto-atualização do veículo para `VENDIDO` não tem o caminho inverso automático (mudar a oportunidade para outro status não devolve o veículo para `DISPONIVEL`) — é intencional para não desfazer uma venda concluída por engano, mas fica registrado como algo a discutir/ajustar caso o negócio real precise disso.
- Sem paginação "infinita"/virtualização nas listagens — usa paginação tradicional do Angular Material, suficiente para o volume de dados esperado de uma revenda de porte pequeno/médio.
- Sem rate limiting nem WAF na API — fora do escopo de "segurança mínima" interpretado para este desafio.

## Melhorias futuras (se o projeto continuasse)

- Autenticação (ex.: JWT) e um conceito básico de usuário/vendedor, permitindo atribuir oportunidades a um vendedor responsável.
- Testes E2E automatizados (Playwright) cobrindo os fluxos críticos de CRUD via navegador real, substituindo parte da verificação manual.
- Testcontainers no backend para os testes de integração rodarem contra um PostgreSQL real, eliminando a diferença entre H2 e o banco de produção.
- Histórico de mudanças de status da oportunidade (auditoria), útil para métricas de funil de vendas.
- Exportação de relatórios (CSV/PDF) a partir das listagens e do dashboard.
