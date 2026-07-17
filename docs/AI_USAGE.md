# Uso de Inteligência Artificial

O desafio permite e incentiva o uso de IA, e a avaliação considera a "capacidade de utilizar IA de forma consciente e produtiva".

Este documento é a resposta honesta a isso: onde a IA ajudou, onde atrapalhou, e o que foi rejeitado.

---

## 1. Princípio adotado

> A IA é um par técnico, não um terceirizado.

Três regras seguidas ao longo do projeto:

1. **Nenhum código foi aceito sem leitura e entendimento.** Se eu não consigo explicar uma linha numa entrevista, ela não entra no commit.
2. **A IA propõe, eu decido.** Toda decisão arquitetural passou por discussão de alternativas, com trade-offs explícitos, antes de virar código.
3. **A IA não valida a si mesma.** Sugestão de IA é hipótese, não verdade. Foi verificada contra documentação oficial, teste executado ou raciocínio próprio.

---

## 2. Ferramentas utilizadas

| Ferramenta | Modelo | Uso principal |
|---|---|---|
| Claude (Anthropic) | Claude Opus 4.8 | Par técnico: requisitos, arquitetura, revisão de código, documentação |
| GitHub Copilot | _a definir_ | Autocompletar em código repetitivo |

---

## 3. Onde a IA foi usada

### 3.1 Levantamento e refino de requisitos

O enunciado é deliberadamente vago. Não define horário de funcionamento, granularidade da grade, se cancelar libera o slot, nem o que diferencia cancelar de excluir.

Usei a IA para **mapear as lacunas sistematicamente** em vez de descobri-las no meio do desenvolvimento. O resultado está em [REQUIREMENTS.md](./REQUIREMENTS.md), seção "Premissas assumidas".

Valor real: cada ambiguidade encontrada no Dia 1 é uma refatoração evitada no Dia 4.

### 3.2 Escolha do domínio

O enunciado não define o nicho. A IA ajudou a avaliar candidatos contra critérios objetivos, não estéticos:

- O nicho justifica duração variável?
- Um único prestador é plausível?
- Está saturado em portfólio?
- Envolve dados sensíveis?

Barbearia, salão e pet shop foram descartados por saturação. Clínica foi descartada por envolver dado sensível de saúde sem política de retenção adequada. Sala de ensaio e test drive foram descartados porque a duração seria fixa, o que enfraqueceria a justificativa da arquitetura.

Lava-rápido venceu por um motivo específico: **duração variável em dois eixos** (serviço × porte do veículo). O registro completo dessa análise virou o [ADR-006](./DECISIONS.md#adr-006).

### 3.3 Discussão de arquitetura

Aqui a IA rendeu mais. O ponto central do projeto, a constraint de exclusão temporal, saiu de uma discussão sobre por que um índice único não resolveria o problema de sobreposição com durações variáveis.

Diálogo resumido:

> **Eu:** posso garantir que não haja overbooking checando disponibilidade antes do insert?
>
> **IA:** não sob concorrência. Duas requisições simultâneas consultam antes de qualquer uma inserir, ambas veem o slot livre, ambas inserem.
>
> **Eu:** e um índice único no horário de início?
>
> **IA:** só pega colisão de início idêntico. Um atendimento de 115min às 14:00 e outro de 40min às 15:00 se sobrepõem sem compartilhar `starts_at`.
>
> **Eu:** então a garantia precisa ser sobre o intervalo, não sobre o instante.
>
> **IA:** exatamente. `EXCLUDE USING gist` sobre `tstzrange`.

O valor não foi a IA saber o comando. Foi ela ter derrubado duas hipóteses minhas com contraexemplos concretos antes de eu escrever código errado.

### 3.4 Design da mecânica de adicionais

O diferencial do projeto (serviço base + adicionais recalculando a grade ao vivo) nasceu de uma ideia minha, mas foi refinado em diálogo.

Minha ideia: o cliente monta o atendimento com opções extras, para não precisar explicar nada no balcão.

Refino da IA: se a duração é a soma dos itens, então a grade de horários deixa de ser propriedade do dia e passa a ser propriedade do carrinho. E, mais importante, isso força uma decisão de UX não óbvia: **o horário precisa ser escolhido por último**, porque marcar um adicional depois de escolher o horário pode invalidar o horário já escolhido.

Essa observação eliminou uma classe inteira de bug antes de existir.

### 3.5 Geração de código

Onde a IA foi produtiva:

| Tarefa | Por que delegar |
|---|---|
| Schema Drizzle a partir do modelo acordado | Boilerplate mecânico |
| Seed do catálogo (24 variantes) | Repetitivo e propenso a erro de digitação |
| Componentes shadcn/ui adaptados | Adaptação de padrão conhecido |
| Casos de teste do serviço de disponibilidade | A IA lembra de casos de borda que eu esqueceria |
| Máscara e validação de telefone e placa | Regex é onde a IA economiza tempo real |

Onde **não** deleguei:

| Tarefa | Por quê |
|---|---|
| Cálculo de disponibilidade | Núcleo do domínio. Escrevi eu, e usei a IA só para revisar |
| Modelagem do banco | Decisão de arquitetura, não implementação |
| Migration da constraint | Precisava entender cada palavra do SQL |

### 3.6 Revisão de código

Usei a IA como revisor, pedindo especificamente que procurasse problemas, não elogios. Achados úteis:

- Um `useEffect` com dependência faltando que causaria stale closure na grade
- Formatação de data que geraria hydration mismatch entre servidor e cliente
- Falta de tratamento do `409` no cliente, que deixaria o usuário sem feedback numa colisão

### 3.7 Documentação

Este documento, os ADRs e o README foram escritos em conjunto com a IA. Eu forneci as decisões e o racional, a IA ajudou a estruturar e a manter consistência entre os documentos.

---

## 4. Onde a IA errou ou foi rejeitada

Esta seção existe porque um relato de uso de IA sem erros é um relato incompleto.

### 4.1 Sugeriu escopo além do prazo

Em mais de um momento a IA propôs funcionalidades sedutoras e caras:

| Sugestão | Por que rejeitei |
|---|---|
| Grafo de incompatibilidade entre adicionais (polimento já inclui cera) | Vira grafo de dependências. Custo alto, ganho invisível num teste técnico |
| Múltiplos boxes com agenda por recurso | Quebra a constraint simples e dobra a complexidade da grade |
| Notificação em tempo real via WebSocket no painel | Vercel serverless não mantém conexão persistente. Exigiria Pusher ou similar. Polling do TanStack Query resolve com uma fração do custo |
| Gestão de múltiplos administradores com convite por e-mail | O enunciado não pede. Um admin criado por script basta |

**Padrão observado:** a IA otimiza para completude técnica, não para prazo. Ela não sente a pressão de cinco dias. Cortar escopo foi decisão exclusivamente minha, e o registro dos cortes está em [REQUIREMENTS.md](./REQUIREMENTS.md), seção "Fora de escopo".

### 4.2 Nome do projeto

A IA sugeriu "LavaJá". Rejeitei: "já" promete imediatismo, mas o produto é agendamento, então o nome brigaria com a função. "LavaÁgil" foi decisão minha, e a IA concordou depois com o argumento de que "ágil" comunica eficiência operacional, que é coerente com a premissa da equipe trabalhando em paralelo.

Pequeno, mas ilustra o ponto: a IA não tem julgamento de produto.

### 4.3 Conhecimento desatualizado

A IA se referiu a `middleware.ts`, que no Next.js 16 foi renomeado para `proxy.ts`. Verificado na documentação oficial e corrigido.

Lição: para APIs de framework que mudam rápido, IA é ponto de partida, documentação oficial é a fonte.

### 4.4 Otimismo sobre bibliotecas

A IA sugeriu `firebase-admin` sem mencionar que a versão 14 puxa `jose@6` e quebra o build do Next com `ERR_REQUIRE_ESM`. Eu já conhecia o problema de um projeto anterior e registrei preventivamente no [ADR-005](./DECISIONS.md#adr-005) e na seção de riscos do [ARCHITECTURE.md](./ARCHITECTURE.md).

Lição: a IA não conhece as pegadinhas de integração específicas de versão. Experiência própria ainda vale mais nesse ponto.

---

## 5. O que a IA não fez

Para deixar claro o limite:

- **Não decidiu a arquitetura.** Ofereceu alternativas com trade-offs. A escolha foi minha e está registrada nos ADRs.
- **Não definiu o escopo.** Todos os cortes foram meus.
- **Não escreveu código que eu não entendo.** Cada trecho foi lido e, quando necessário, reescrito.
- **Não testou nada.** Os testes rodam, e a garantia da constraint foi verificada com dois inserts concorrentes reais, não com a palavra da IA.

---

## 6. Balanço

**Onde a IA mais rendeu:**

1. **Derrubar hipóteses erradas cedo.** O contraexemplo do índice único me poupou de descobrir o problema em produção.
2. **Mapear lacunas de requisito sistematicamente.** Cada ambiguidade resolvida no Dia 1 é uma refatoração evitada no Dia 4.
3. **Boilerplate.** Seed de 24 variantes, schemas, componentes. Trabalho mecânico que consome tempo sem ensinar nada.
4. **Lembrar casos de borda em teste.** "E se o agendamento estiver cancelado? E no sábado? E se a duração mudar depois de escolher o horário?"

**Onde ela não substitui o desenvolvedor:**

1. **Julgamento de prazo.** Ela não sente cinco dias.
2. **Julgamento de produto.** Ela sugeriu um nome que brigava com a própria função do sistema.
3. **Pegadinhas de versão.** `jose@6`, `proxy.ts`. Coisas que só se aprende quebrando.
4. **Decidir.** Ela lista trade-offs bem. Escolher é trabalho humano.

**Em uma frase:** a IA acelerou o caminho até as decisões certas, mas as decisões continuaram sendo minhas, e é por isso que consigo defender cada uma delas.

---

## 7. Prompts que valeram a pena

Registrados porque a qualidade do output foi proporcional à qualidade do input.

**Bom:**

> "Tenho um sistema de agendamento com um único box e atendimentos de duração variável. Preciso garantir que dois agendamentos nunca se sobreponham. Me dê as opções de garantia de integridade, do mais fraco ao mais forte, com os trade-offs de cada um."

Por que funcionou: descreveu o problema, não a solução desejada. Pediu alternativas, não confirmação.

**Bom:**

> "Revise esse componente procurando problemas. Não me diga o que está bom."

Por que funcionou: IA tende à concordância. Pedir explicitamente por problemas neutraliza isso.

**Ruim:**

> "Cria um sistema de agendamento em Next.js."

Por que falhou: gerou código genérico, sem contexto de domínio, que eu teria que reescrever inteiro. Prompt vago produz resposta média.
