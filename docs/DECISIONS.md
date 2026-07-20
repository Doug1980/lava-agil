# Registro de Decisões Arquiteturais (ADRs)

Cada decisão relevante fica registrada aqui com contexto, alternativas consideradas e consequências, incluindo as negativas.

Formato: [ADR](https://adr.github.io/), simplificado.

**Índice**

| # | Decisão | Status |
|---|---|---|
| [ADR-001](#adr-001) | Monolito Next.js em vez de front e back separados | Aceito |
| [ADR-002](#adr-002) | PostgreSQL com constraint de exclusão temporal | Aceito |
| [ADR-003](#adr-003) | Duração como dado, não como lógica | Aceito |
| [ADR-004](#adr-004) | Snapshot de preço e duração nos itens | Aceito |
| [ADR-005](#adr-005) | Firebase Auth com session cookie httpOnly | Aceito |
| [ADR-006](#adr-006) | Um único box de atendimento | Aceito |
| [ADR-007](#adr-007) | Fuso horário fixo do estabelecimento | Aceito |
| [ADR-008](#adr-008) | Servidor recalcula preço e duração | Aceito |
| [ADR-009](#adr-009) | Cancelar e excluir são operações distintas | Aceito |
| [ADR-010](#adr-010) | Zod como fonte única de validação | Aceito |
| [ADR-011](#adr-011) | firebase-admin 12 para resolver `ERR_REQUIRE_ESM` na Vercel | Aceito |

---

## ADR-001

### Monolito Next.js em vez de front e back separados

**Status:** Aceito · Dia 1

**Contexto**

O desafio pede separação entre a visão do cliente e a visão administrativa, e deploy público. Meu histórico recente inclui um monorepo Turborepo com Next.js na Vercel e API Hono no Railway, que seria o caminho mais "arquitetural".

**Decisão**

Monolito Next.js com App Router. A separação cliente/admin é feita por **rota, com proteção no servidor**: `/agendar` e `/meus-agendamentos` são públicas; `/admin` e as rotas de API sensíveis exigem sessão de administrador (verificada em server components e Route Handlers).

**Alternativas consideradas**

| Alternativa | Por que não |
|---|---|
| Monorepo Turborepo com API separada | Dois deploys, dois pipelines, configuração de CORS, variáveis duplicadas. Consome prazo sem ganhar ponto de avaliação |
| Next.js + Server Actions apenas | Dificultaria demonstrar contratos de API e retornar códigos HTTP semânticos como o `409` |

**Consequências**

Positivas:
- Um deploy, um pipeline, zero CORS
- Separação por rota + verificação de papel no servidor isola a área administrativa sem custo de infra
- Tipos compartilhados entre front e back sem publicar pacote

Negativas:
- Acoplamento entre front e back. Se um dia a API precisar servir um app mobile, exigiria extração
- Menos "impressionante" à primeira vista que um monorepo

**Nota:** a separação que o enunciado pede é de **visão**, não de **deploy**. A separação por rota, com verificação de papel no servidor, atende ao requisito literal e ao espírito dele.

---

## ADR-002

### PostgreSQL com constraint de exclusão temporal

**Status:** Aceito · Dia 1

**Contexto**

Este é o problema central do domínio. Um único box, e atendimentos de durações variáveis que não podem se sobrepor.

A abordagem ingênua é verificar disponibilidade em JavaScript antes de inserir:

```ts
const conflito = await db.select()...  // consulta
if (conflito) throw new Error('ocupado')
await db.insert(appointments)...       // insere
```

Isso **falha sob concorrência**. Dois clientes clicando no mesmo slot no mesmo instante: ambas as requisições consultam antes de qualquer uma inserir, ambas veem o slot livre, ambas inserem. Overbooking.

A janela é pequena, mas existe, e é exatamente o tipo de bug que só aparece em produção com usuários reais.

**Decisão**

PostgreSQL com constraint de exclusão sobre range de tempo.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT appointments_no_overlap
EXCLUDE USING gist (
  tstzrange(starts_at, ends_at) WITH &&
) WHERE (status <> 'cancelled');
```

Sobreposição torna-se fisicamente impossível de gravar. Não importa quantas requisições cheguem simultaneamente, o banco rejeita.

**Alternativas consideradas**

| Alternativa | Por que não |
|---|---|
| Índice único em `(starts_at)` | Só pega colisão de início idêntico. Um atendimento de 115min às 14:00 e outro de 40min às 15:00 se sobrepõem sem ter o mesmo `starts_at`. Não resolve |
| `SELECT ... FOR UPDATE` | Funciona, mas exige transação explícita e lock manual. Mais código, mais chance de erro, e o lock precisaria ser sobre o dia inteiro |
| MongoDB com índice único | Mesmo limite do índice único no Postgres, sem a opção de range |
| Lock em Redis | Infra adicional, ponto de falha novo, e ainda seria uma garantia externa ao dado |
| Serializable isolation | Resolve, mas penaliza toda a aplicação por um problema pontual |

**Consequências**

Positivas:
- Garantia de integridade no lugar mais confiável possível: o dado
- O `WHERE (status <> 'cancelled')` faz o cancelamento devolver o horário automaticamente, sem código
- Quatro linhas de SQL substituem uma camada inteira de lock
- Funciona mesmo se alguém inserir direto no banco

Negativas:
- Amarra o projeto ao PostgreSQL. Migrar para MongoDB exigiria reimplementar a garantia
- Drizzle não expressa `EXCLUDE` no schema TypeScript. Exige migration SQL manual
- A mensagem de erro do Postgres é críptica. A API precisa traduzi-la para `409` com mensagem útil

**Sobre a validação no front-end**

Ela continua existindo, mas com outro propósito. Validação em aplicação previne o **caso comum** (mostrar ao cliente um horário que vai falhar). A constraint previne o **caso concorrente**. As duas coexistem porque resolvem problemas diferentes. Confundir uma com a outra é o erro clássico.

---

## ADR-003

### Duração como dado, não como lógica

**Status:** Aceito · Dia 1

**Contexto**

A duração de um atendimento depende de três eixos: serviço base, porte do veículo e adicionais escolhidos. A tentação é escrever isso em código:

```ts
// Não fazer isso
function calcularDuracao(servico: string, porte: string) {
  if (servico === 'lavagem-completa') {
    if (porte === 'hatch') return 35;
    if (porte === 'sedan') return 40;
    return 50;
  }
  // ...e assim por diante
}
```

Isso cresce como praga. Cada serviço novo é um `if`. Cada ajuste de tempo é um deploy.

**Decisão**

A duração vive no banco. Serviços base e adicionais na mesma tabela, distinguidos por `kind`. Cada serviço tem uma variante por porte:

```
services          → id, name, kind ('base' | 'addon')
service_variants  → service_id, vehicle_size, duration_minutes, price_cents
```

A duração total é:

```ts
const total = items.reduce((acc, i) => acc + i.durationMinutes, 0);
```

**Consequências**

Positivas:
- Zero condicionais de negócio calculando tempo
- Adicionais herdam variação por porte de graça (higienizar uma picape leva mais que um hatch)
- Novo serviço é `INSERT`, não deploy
- O código de precificação e duração é trivial de testar
- A complexidade mora no dado, que é onde ela deve morar

Negativas:
- Seed maior: 8 serviços × 3 portes = 24 linhas
- Alguns adicionais têm a mesma duração em todos os portes, gerando linhas redundantes

**Sobre a redundância:** considerei um `vehicle_size = 'any'` para serviços que não variam. Rejeitado, porque criaria dois caminhos de consulta (buscar a variante específica, e se não achar buscar a genérica). Três linhas idênticas custam menos que uma condicional no acesso a dados.

---

## ADR-004

### Snapshot de preço e duração nos itens

**Status:** Aceito · Dia 1

**Contexto**

Se um agendamento apenas referenciasse `service_variant_id`, e o dono reajustasse a tabela de preços, todos os agendamentos passados mudariam de valor retroativamente. Um atendimento concluído por R$ 270 apareceria como R$ 310 no histórico.

**Decisão**

Cada `appointment_item` guarda uma cópia congelada do estado do catálogo no momento da reserva:

```
service_name_snap, kind_snap, duration_snap, price_snap
```

`service_variant_id` permanece como referência, mas nunca é usado para exibir valores de agendamentos existentes.

**Consequências**

Positivas:
- Histórico íntegro. Reajuste não reescreve o passado
- O agendamento sobrevive à desativação ou remoção de um serviço do catálogo
- Mesmo princípio de um pedido de e-commerce, que é exatamente o que é

Negativas:
- Duplicação controlada de dados
- Renomear um serviço não propaga para agendamentos antigos, o que é o comportamento desejado, mas pode surpreender quem não conhece a decisão

---

## ADR-005

### Firebase Auth com session cookie httpOnly

**Status:** Aceito · Dia 1

**Contexto**

A área administrativa precisa de autenticação. O enunciado pede credenciais no README, então precisa ser simples de demonstrar.

**Decisão**

Firebase Auth (e-mail/senha) no client. O ID token é trocado por um session cookie httpOnly emitido pelo servidor via `firebase-admin`. Autorização por uma **allowlist de e-mails (`ADMIN_EMAILS`)** lida do ambiente e verificada no servidor.

```
Login → ID token → POST /api/session → verifyIdToken → session cookie
                                                          ↓
                        guard (requireAdmin): e-mail do cookie ∈ ADMIN_EMAILS?
```

**Alternativas consideradas**

| Alternativa | Por que não |
|---|---|
| NextAuth com Credentials e senha em env | Funciona, mas gerenciar hash de senha manualmente é reinventar roda. E o reset de senha ficaria por minha conta |
| Google OAuth restrito por e-mail | Bom, mas o avaliador precisaria de uma conta Google autorizada. Atrito na avaliação |
| Cookie de sessão próprio, sem lib | Escrever autenticação do zero em teste técnico é sinal de alerta, não de competência |

**Por que session cookie e não o ID token direto**

O ID token expira em 1 hora e fica acessível a JavaScript. O session cookie é `httpOnly`, invisível ao DevTools e a XSS, e permite validar no servidor antes de renderizar, eliminando o flash de conteúdo não autorizado.

**Por que allowlist no servidor**

Uma lista de e-mails **no front-end** seria contornável com o DevTools em segundos — mas aqui a `ADMIN_EMAILS` é lida e verificada **exclusivamente no servidor** (em `requireAdmin`, sobre o e-mail do session cookie já validado pelo Firebase). O cliente nunca decide o próprio papel. Para um único operador, uma allowlist server-side é simples e segura; a evolução para **custom claims** (assinadas pelo Firebase) e hierarquia de papéis está registrada como trabalho futuro.

**Consequências**

Positivas:
- Reset de senha e hash gerenciados pelo Firebase
- Proteção server-side real, sem flash de conteúdo
- Extensível para OAuth sem reescrever nada

Negativas:
- Dependência de serviço externo
- Mais variáveis de ambiente
- `firebase-admin@14` puxa `jwks-rsa@4 → jose@6` (ESM-only) e quebra em produção com `ERR_REQUIRE_ESM` no runtime serverless da Vercel, embora funcione no dev local. Resolvido fixando o `firebase-admin@12` (cadeia CommonJS). Ver [ADR-011](#adr-011)

---

## ADR-006

### Um único box de atendimento

**Status:** Aceito · Dia 1

**Contexto**

O LavaÁgil opera com quatro atendentes. A pergunta natural é se isso significa quatro atendimentos simultâneos.

**Decisão**

Um box, uma agenda. Os quatro atendentes trabalham **em paralelo no mesmo veículo**: um passa a mangueira, outro aplica produto, um terceiro enxagua, um quarto seca.

**Consequências**

Positivas:
- O paralelismo é dentro do slot, não entre slots. A constraint de exclusão simples continua válida
- Justifica durações curtas (lavagem completa em 40min), gerando uma grade densa e viva
- Reforça o nome do produto: ágil porque a operação é enxuta

Negativas:
- Não escala para uma operação com múltiplos boxes sem remodelar a agenda por recurso

**Nota:** se cada atendente lavasse um carro diferente, o modelo seria agenda por recurso, a constraint precisaria de `EXCLUDE USING gist (box_id WITH =, tstzrange(...) WITH &&)`, e a grade multiplicaria por N. Registrado como caminho de evolução, deliberadamente fora do escopo.

---

## ADR-007

### Fuso horário fixo do estabelecimento

**Status:** Aceito · Dia 1

**Contexto**

Agendamento e fuso horário é uma combinação que gera bugs sutis. O horário de funcionamento é 09:00 às 18:00, mas 09:00 de onde?

**Decisão**

Todo cálculo de disponibilidade usa `America/Sao_Paulo` explicitamente, no servidor. O fuso do navegador **nunca** é usado para lógica de negócio.

`starts_at` e `ends_at` são `timestamptz`, armazenados em UTC pelo Postgres, mas toda a aritmética de jornada acontece com fuso explícito.

**Consequências**

Positivas:
- Um cliente acessando de Portugal vê a mesma grade que um cliente em São Paulo, que é o comportamento correto: a jornada é propriedade do estabelecimento
- Elimina a classe de bug "funciona na minha máquina, quebra na Vercel", já que servidores rodam em UTC
- Evita hydration mismatch de `toLocaleString()` entre servidor e cliente

Negativas:
- Formatação de data precisa de cuidado explícito em todo lugar
- Não suporta múltiplas filiais em fusos diferentes, o que está fora de escopo

---

## ADR-008

### Servidor recalcula preço e duração

**Status:** Aceito · Dia 1

**Contexto**

O front-end calcula duração e valor ao vivo conforme o cliente monta o carrinho. Seria natural enviar esses valores no `POST`.

**Decisão**

O cliente envia apenas `serviceVariantIds` e `startsAt`. O servidor busca as variantes, recalcula duração e preço, e ignora qualquer valor que venha no payload.

**Consequências**

Positivas:
- Impossível agendar um polimento pelo preço de uma lavagem simples adulterando a requisição
- Fonte única de verdade para o cálculo
- O cálculo no front é apenas espelho, e existe para UX

Negativas:
- O cálculo existe em dois lugares. Mitigado colocando a função de soma em módulo compartilhado, importado pelos dois lados

**Regra geral:** o front-end calcula para **mostrar**, o back-end calcula para **valer**. Nunca confiar em número vindo do cliente.

---

## ADR-009

### Cancelar e excluir são operações distintas

**Status:** Aceito · Dia 1

**Contexto**

O enunciado lista "Cancelar ou excluir agendamentos" como um item só, o que é ambíguo. Poderia ser sinônimo.

**Decisão**

São operações distintas.

| Ação | Efeito | Reversível | Método |
|---|---|---|---|
| Cancelar | `status = 'cancelled'`. Preserva o registro. Libera o slot | Sim | `PATCH /:id/status` |
| Excluir | Remove a linha. Exige confirmação | Não | `DELETE /:id` |

**Consequências**

Positivas:
- Cancelar preserva histórico, que é o que um negócio real precisa
- O `WHERE (status <> 'cancelled')` da constraint devolve o horário automaticamente
- Excluir cobre manutenção: registros de teste, spam

Negativas:
- Duas ações destrutivas na interface exigem UX cuidadosa para não confundir. Mitigado com cores e diálogo de confirmação distintos

---

## ADR-010

### Zod como fonte única de validação

**Status:** Aceito · Dia 1

**Contexto**

O enunciado pede validação básica de formulário. A tentação é validar no front com uma lib e no back com outra, ou pior, validar só no front.

**Decisão**

Schemas Zod em `src/lib/schemas/`, importados pelo React Hook Form no cliente e pelos Route Handlers no servidor.

```ts
export const createAppointmentSchema = z.object({
  customer: z.object({
    name: z.string().min(3).max(120),
    phone: z.string().regex(/^\d{10,11}$/),
    email: z.string().email().optional(),
  }),
  vehicle: z.object({
    plate: z.string().regex(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/),
    model: z.string().min(2).max(60),
    size: z.enum(['hatch', 'sedan', 'suv']),
  }),
  startsAt: z.string().datetime(),
  serviceVariantIds: z.array(z.string().uuid()).min(1),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
```

**Consequências**

Positivas:
- Uma regra, um lugar. Mudar o formato de telefone atualiza os dois lados
- Tipos inferidos do schema, sem interface duplicada
- Validação no servidor é obrigatória, e aqui ela sai de graça

Negativas:
- Nenhuma relevante. Este é o padrão do ecossistema

**Nota sobre placa:** o regex aceita tanto o padrão antigo (`ABC1234`) quanto Mercosul (`ABC1D23`), que é o comportamento correto no Brasil hoje.

---

## ADR-011

### firebase-admin 12 para resolver `ERR_REQUIRE_ESM` na Vercel

**Status:** Aceito · deploy

**Contexto**

No deploy da Vercel, toda rota que toca o `firebase-admin` (a home, o painel, as rotas de API protegidas) retornava **500** em produção, mesmo com o build passando e tudo funcionando no `pnpm dev` local. O log de runtime apontava:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../jose@6/dist/webapi/index.js
from .../jwks-rsa@4.1.0/src/utils.js not supported.
```

A cadeia `firebase-admin@14 → jwks-rsa@4 → jose@6` (ESM-only) é carregada via `require()` no bundle serverless do Turbopack, e o Node do runtime não aceitava esse `require` de ESM.

**Decisão**

Fixar **`firebase-admin@12`**, cuja cadeia usa `jwks-rsa@3 → jose@4` (CommonJS). Sem `require()` de ESM, o erro desaparece na raiz — independente da versão do Node ou do empacotador. O projeto também fixa `engines.node = "22.x"`.

**Alternativas consideradas**

| Alternativa | Por que não |
|---|---|
| Subir o Node para 22.x/24.x (que têm `require(esm)`) | Testado: o erro persistiu, porque o `externalImport` do Turbopack não passa pelo `require(esm)` nativo |
| Override do `jose` para uma versão CommonJS | `jwks-rsa@4` depende da API do `jose@6`; forçar v4 quebraria o `jwks-rsa` |
| Build com webpack em vez de Turbopack (`--webpack`) | Frágil no Next 16, que assume Turbopack; troca um problema por incerteza |

**Consequências**

Positivas:
- Correção determinística: elimina a dependência ESM problemática em vez de depender de flags de runtime
- A API do Admin SDK usada (`cert`, `getAuth`, `verifySessionCookie`, `createSessionCookie`) é idêntica entre a v12 e a v14, então nada no código muda

Negativas:
- Presa a uma major mais antiga do `firebase-admin`. A atualização para v13+ depende de o ecossistema (Turbopack/Next) lidar melhor com o `require` de ESM

**Nota:** o [ADR-005](#adr-005) previa esse risco (`firebase-admin@14` + `jose@6`), mas a mitigação planejada na época (webpack + override) não se mostrou viável no Next 16 — o fix real foi a v12.

---

## Template para novas decisões

```markdown
## ADR-0XX

### Título

**Status:** Proposto | Aceito | Substituído por ADR-0YY · Dia N

**Contexto**
Qual problema estamos resolvendo, e por que agora.

**Decisão**
O que foi decidido.

**Alternativas consideradas**
| Alternativa | Por que não |

**Consequências**
Positivas e negativas. Ser honesto sobre as negativas é o que dá valor ao documento.
```
