# Prompt de Kickoff do Projeto

> Este documento existe para demonstrar, de forma concreta, a maturidade no uso de IA pedida pelo desafio. O que segue é a parte técnica do pedido inicial, escrita como um prompt limpo e reutilizável — o tipo de prompt que, na prática, deu o pontapé inicial deste projeto.

## O prompt

```text
Papel: atue como um engenheiro de software sênior full-stack, responsável por
entregar um projeto real sob prazo — não um exercício de sala de aula. Preze
por decisões defensáveis em entrevista, não pela solução mais impressionante.

Contexto: isto é um teste técnico de um processo seletivo. O enunciado
completo está anexado (PDF/DOCX) e é a única fonte de verdade sobre os
requisitos — não resuma o pedido com suas próprias palavras nem preencha
lacunas por conta própria. Onde o enunciado for omisso, pare e me pergunte,
ou assuma uma premissa e documente-a explicitamente; nunca decida em silêncio.

Tarefa: implemente o sistema descrito no enunciado (um CRM de venda de
carros) usando a stack obrigatória especificada nele (Angular + Java/Spring
Boot + PostgreSQL, dockerizado). Dentro dessa stack, a arquitetura é livre.

Entregáveis obrigatórios, com o mesmo nível de cuidado do código:
1. Código-fonte funcional, cobrindo os requisitos mínimos do enunciado.
2. Manual de execução — como rodar tudo do zero, banco de dados incluído.
3. Documentação semântica do domínio, escrita para um agente de IA que for
   evoluir o projeto depois entender o sistema antes de tocar no código.
4. Documentação de QA, escrita para um agente de IA saber o que testar, como
   rodar cada suíte, e o que "pronto" significa aqui.
5. Um registro real das execuções de teste feitas com apoio de IA durante o
   desenvolvimento: comandos de verdade, saídas de verdade, falhas
   encontradas e a correção de cada uma. Nada simulado ou escrito depois
   como se tivesse acontecido.

Modo de trabalho: avance incrementalmente — implemente uma parte, rode e
valide, só então siga para a próxima. Nunca escreva o projeto inteiro para
depois descobrir, na primeira execução, que a base está errada. Toda decisão
técnica que o enunciado não especificar deve vir com a premissa e o motivo
registrados, não só a escolha.

Guardrails: pare e me pergunte antes de qualquer ação irreversível ou visível
publicamente — criar e publicar um repositório, por exemplo. Prefiro ser
interrompido a ser surpreendido.
```

## Por que esta estrutura — o que cada parte evita

Um prompt bom não é o que soa mais completo; é o que fecha, uma por uma, as formas mais comuns de um projeto assistido por IA dar errado. Cada parágrafo acima existe para bloquear um erro específico:

- **Papel** evita a resposta genérica de "assistente prestativo" — sem uma calibração de rigor, o modelo tende a otimizar para parecer útil rápido, não para decisões defensáveis. Dizer "sênior, sob prazo real" muda o padrão de qualidade que ele aplica a si mesmo.
- **Contexto antes da tarefa** evita otimizar para o pedido errado. Um modelo que sabe que isto é avaliado por uma empresa se comporta de forma mensuravelmente diferente de um que só recebeu "faça um CRM".
- **Fonte de verdade explícita** evita o telefone-sem-fio: se eu descrevo o enunciado com minhas palavras, qualquer detalhe que eu esquecer de mencionar simplesmente desaparece do projeto. Anexar o documento original e proibir resumo elimina essa perda.
- **"Pare e pergunte, ou documente a premissa"** evita a pior das duas alternativas ruins: ficar travado esperando uma resposta que não é crítica, ou decidir sozinho sem deixar rastro. Cobrir os dois casos com uma regra clara evita ambas.
- **Ambiente declarado, nunca presumido** evita comandos que assumem uma ferramenta que não existe (e falham a metade do projeto depois) e também comandos "de segurança" desnecessários. É o que fez a instalação de Java, Docker e Angular CLI ser verificada antes de qualquer `brew install`.
- **Entregáveis numerados e nomeados** evita a entrega vaga que não dá para checar se terminou. "Faça um teste técnico" não tem critério de aceite; "entregue estes 5 arquivos" tem — e cada um virou, de fato, um arquivo real no repositório.
- **Execução real, nunca simulada** é a regra mais importante do prompt: sem ela, é trivial para uma IA escrever um `TEST_EXECUTION_LOG.md` bonito e inventado. Com ela, o documento tem bugs reais e corrigidos — inclusive um que só apareceu na primeira execução real do pipeline de CI, depois do push.
- **Modo de trabalho incremental** evita o padrão mais caro de todos: gerar o projeto inteiro de uma vez e só descobrir na primeira tentativa de rodar que a base estava errada. Validar a cada passo troca um retrabalho grande por vários pequenos.
- **Guardrail de ação irreversível** é a única linha que protege você, não o projeto: sem ela, nada impede a IA de criar e publicar um repositório antes de você ter visto o resultado. Com ela, a decisão de tornar algo público continua sendo sua.

Ver [AGENT_GUIDE.md](AGENT_GUIDE.md) para como esse processo se traduziu em decisões concretas de arquitetura, e [TEST_EXECUTION_LOG.md](TEST_EXECUTION_LOG.md) para o registro real de execução mencionado no item 5.
