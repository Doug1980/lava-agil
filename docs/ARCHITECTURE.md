# Arquitetura

## 1. Visão geral

Monolito Next.js com App Router, deployado como aplicação única na Vercel.

```
┌──────────────────────────────────────────────────────────┐
│                      Navegador                           │
│  ┌────────────────────┐      ┌────────────────────────┐  │
│  │  Área do Cliente   │      │  Área Administrativa   │  │
│  │  (client)          │      │  (admin)               │  │
│  │  Pública           │      │  Firebase Auth         │  │
│  └────────────────────┘      └────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼───────────────────────────────┐
│                    Next.js (Vercel)                      │
│                                                          │
│  proxy.ts          protege /admin/*                      │
│       │                                                  │
│  app/api/*         Route Handlers, camada fina           │
│       │            valida entrada e delega               │
│       ▼                                                  │
│  server/services/  regra de negócio pura                 │
│       │            não conhece HTTP, testável isolada    │
│       ▼                                                  │
│  server/db/        Drizzle ORM                           │
└──────────────────────────┬───────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │ Firebase Auth │  │  Gmail SMTP   │
│    (Neon)     │  │               │  │  (Nodemailer) │
│               │  │ Custom claims │  │               │
│ EXCLUDE gist  │  │ Session cookie│  │ Confirmação   │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Princípio de camadas

A regra é simples: **a lógica de negócio não conhece HTTP**.

- `app/api/*` recebe a requisição, valida com Zod, chama um service, mapeia o retorno para uma resposta HTTP. Nada mais.
- `server/services/*` contém funções puras que recebem dados e devolvem dados. É onde mora o cálculo de disponibilidade, a validação de transição de status e a montagem da OS.
- `server/db/*` é acesso a dados.

Consequência prática: os testes das regras de disponibilidade rodam sem subir servidor e sem mockar `Request`. Executam em milissegundos.

---

## 2. Estrutura de pastas

```
lava-agil/
├── docs/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── AI_USAGE.md
│   ├── ROADMAP.md
│   └── screenshots/
├── public/
├── scripts/
│   ├── seed.ts                  # popula catálogo e agendamentos de exemplo
│   └── create-admin.ts          # cria usuário e atribui custom claim
├── src/
│   ├── app/
│   │   ├── (client)/            # route group público
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    # fluxo de agendamento
│   │   │   └── agendamento/[id]/page.tsx   # confirmação
│   │   ├── (admin)/             # route group protegido
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx                # painel
│   │   │       └── login/page.tsx
│   │   ├── api/
│   │   │   ├── services/route.ts
│   │   │   ├── availability/route.ts
│   │   │   ├── appointments/
│   │   │   │   ├── route.ts                # GET lista, POST cria
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts            # GET, DELETE
│   │   │   │       ├── status/route.ts     # PATCH
│   │   │   │       └── items/[itemId]/route.ts  # PATCH checklist
│   │   │   └── auth/session/route.ts       # troca ID token por cookie
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── client/              # componentes do fluxo de agendamento
│   │   └── admin/               # componentes do painel
│   ├── hooks/
│   │   ├── use-booking-cart.ts  # estado do carrinho
│   │   └── use-availability.ts  # query da grade
│   ├── lib/
│   │   ├── schemas/             # Zod, compartilhado front/back
│   │   ├── firebase/
│   │   │   ├── client.ts
│   │   │   └── admin.ts
│   │   ├── format.ts            # moeda, telefone, data
│   │   └── constants.ts         # horários, buffer, granularidade
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts         # conexão lazy
│   │   │   ├── schema.ts        # Drizzle
│   │   │   └── queries/
│   │   ├── services/
│   │   │   ├── availability.ts  # ⭐ núcleo do domínio
│   │   │   ├── booking.ts
│   │   │   ├── pricing.ts
│   │   │   └── status.ts
│   │   ├── mail/
│   │   │   ├── transport.ts
│   │   │   └── templates/
│   │   └── auth/
│   │       └── session.ts
│   ├── types/
│   └── proxy.ts                 # middleware (renomeado no Next 16)
├── tests/
│   ├── availability.test.ts
│   ├── pricing.test.ts
│   └── status.test.ts
├── drizzle.config.ts
├── .env.example
└── README.md
```

**Sobre `proxy.ts`:** no Next.js 16 o arquivo `middleware.ts` foi renomeado para `proxy.ts`. Detalhe que causa confusão em tutoriais antigos.

---

## 3. Modelo de dados

### 3.1 Diagrama

```
┌─────────────────────┐
│      services       │
├─────────────────────┤
│ id            PK    │
│ name                │
│ slug          UQ    │
│ kind    base|addon  │
│ description         │
│ sort_order          │
│ active              │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐
│  service_variants   │
├─────────────────────┤
│ id            PK    │
│ service_id    FK    │
│ vehicle_size        │  hatch | sedan | suv
│ duration_minutes    │
│ price_cents         │
│ UNIQUE(service_id,  │
│        vehicle_size)│
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐        ┌──────────────────────────┐
│  appointment_items  │  N:1   │      appointments        │
├─────────────────────┤───────▶├──────────────────────────┤
│ id              PK  │        │ id                  PK   │
│ appointment_id  FK  │        │ code                UQ   │
│ service_variant_id  │        │ customer_name            │
│ service_name_snap   │        │ customer_phone           │
│ kind_snap           │        │ customer_email           │
│ duration_snap       │        │ vehicle_plate            │
│ price_snap          │        │ vehicle_model            │
│ completed_at        │        │ vehicle_size             │
└─────────────────────┘        │ starts_at      timestamptz│
                               │ ends_at        timestamptz│
                               │ service_minutes          │
                               │ total_price_cents        │
                               │ status                   │
                               │ notes                    │
                               │ created_at               │
                               │                          │
                               │ EXCLUDE USING gist       │
                               │   tstzrange(starts,ends) │
                               │   WHERE status<>cancelled│
                               └──────────────────────────┘
```

### 3.2 Decisões do modelo

**Serviço base e adicional na mesma tabela.** A diferença é o campo `kind`. Isso significa que um adicional também tem variante por porte (higienizar uma picape leva mais que um hatch) sem nenhum código condicional. Adicionar um novo serviço é inserir linhas, não escrever lógica.

**`ends_at` é derivado mas persistido.** Poderia ser calculado, mas a constraint de exclusão precisa dele materializado na linha para operar. Ele inclui o buffer:

```
ends_at = starts_at + service_minutes + BUFFER_MINUTES
```

O campo `service_minutes` guarda a duração **sem** buffer, que é o que o cliente vê. A diferença entre os dois é o buffer operacional, invisível para o cliente.

**Snapshots nos itens.** `service_name_snap`, `duration_snap` e `price_snap` congelam o estado do catálogo no momento da reserva. Se o preço mudar amanhã, o histórico permanece íntegro. `service_variant_id` continua ali como referência, mas nunca é usado para exibir valores de agendamentos passados.

**`code` legível.** Um identificador curto tipo `LA-1042` para o cliente e para a OS. UUID no banco, código amigável na interface.

**`completed_at` no item.** É o checklist de execução. O admin marca cada serviço conforme executa. Nasce de graça da tabela que já existe.

### 3.3 Schema Drizzle (esboço)

```ts
// src/server/db/schema.ts
import {
  pgTable, uuid, text, integer, timestamp, boolean, pgEnum, unique,
} from 'drizzle-orm/pg-core';

export const serviceKindEnum = pgEnum('service_kind', ['base', 'addon']);
export const vehicleSizeEnum = pgEnum('vehicle_size', ['hatch', 'sedan', 'suv']);
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled', 'confirmed', 'completed', 'cancelled',
]);

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  kind: serviceKindEnum('kind').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const serviceVariants = pgTable('service_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  vehicleSize: vehicleSizeEnum('vehicle_size').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
}, (t) => ({
  uq: unique().on(t.serviceId, t.vehicleSize),
}));

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  vehiclePlate: text('vehicle_plate').notNull(),
  vehicleModel: text('vehicle_model').notNull(),
  vehicleSize: vehicleSizeEnum('vehicle_size').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  serviceMinutes: integer('service_minutes').notNull(),
  totalPriceCents: integer('total_price_cents').notNull(),
  status: appointmentStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentItems = pgTable('appointment_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  serviceVariantId: uuid('service_variant_id')
    .references(() => serviceVariants.id, { onDelete: 'set null' }),
  serviceNameSnap: text('service_name_snap').notNull(),
  kindSnap: serviceKindEnum('kind_snap').notNull(),
  durationSnap: integer('duration_snap').notNull(),
  priceSnap: integer('price_snap').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
```

### 3.4 Migration manual da constraint

O Drizzle não expressa `EXCLUDE USING gist` no schema TypeScript. A constraint entra via migration SQL customizada:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT appointments_no_overlap
EXCLUDE USING gist (
  tstzrange(starts_at, ends_at) WITH &&
) WHERE (status <> 'cancelled');
```

Isso será documentado no ADR-002 e testado explicitamente no Dia 1.

---

## 4. O núcleo do domínio: cálculo de disponibilidade

O algoritmo, em pseudocódigo:

```
função horáriosDisponíveis(data, duraçãoTotal):
  1. jornada ← horário de funcionamento da data
     se fechado → retorna []

  2. candidatos ← gerar slots de 15 em 15min
                  de jornada.abertura até jornada.fechamento

  3. ocupados ← SELECT starts_at, ends_at FROM appointments
                WHERE status <> 'cancelled'
                  AND intervalo intersecta o dia

  4. para cada candidato:
       fim ← candidato + duraçãoTotal + BUFFER

       descarta se: candidato < agora + ANTECEDÊNCIA_MÍNIMA
       descarta se: fim > jornada.fechamento + BUFFER
       descarta se: [candidato, fim) intersecta algum ocupado

  5. retorna os que sobraram
```

**Duas propriedades importantes:**

1. `duraçãoTotal` é parâmetro, não constante. É por isso que a grade muda quando o cliente mexe nos adicionais.
2. A função é **pura**. Recebe data, duração, jornada, lista de ocupados e "agora". Não toca no banco, não conhece HTTP. Testar cada regra é uma linha de teste.

**O passo 4 não é a garantia de integridade.** Ele é UX: evita mostrar ao cliente um horário que vai falhar. Entre a leitura da grade e o `INSERT`, outro cliente pode reservar. A garantia real está na constraint do banco, e a API traduz a violação em `409 Conflict`.

Isso é uma distinção que vale explicitar: **validação em aplicação previne o caso comum, constraint em banco previne o caso concorrente**. As duas coexistem por motivos diferentes.

---

## 5. Contratos da API

### `GET /api/services`

Retorna o catálogo com as variantes do porte informado.

```
GET /api/services?vehicleSize=sedan
```

```json
{
  "base": [
    {
      "id": "…", "slug": "lavagem-completa", "name": "Lavagem completa",
      "description": "Externa, rodas, vidros e aspiração",
      "variant": { "durationMinutes": 40, "priceCents": 7000 }
    }
  ],
  "addons": [
    {
      "id": "…", "slug": "pretinho-pneus", "name": "Pretinho nos pneus",
      "variant": { "durationMinutes": 15, "priceCents": 2000 }
    }
  ]
}
```

### `GET /api/availability`

```
GET /api/availability?date=2026-07-24&durationMinutes=115
```

```json
{
  "date": "2026-07-24",
  "open": true,
  "businessHours": { "start": "09:00", "end": "18:00" },
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:15", "available": false, "reason": "occupied" },
    { "time": "16:15", "available": false, "reason": "closing" }
  ]
}
```

Retornar os indisponíveis com o motivo, em vez de omiti-los, permite ao front-end renderizar a grade completa com os bloqueados desabilitados. O cliente entende **por que** não pode escolher aquele horário, o que é melhor que o horário simplesmente sumir.

### `POST /api/appointments`

```json
{
  "customer": { "name": "Douglas Salazar", "phone": "11987654321", "email": "…" },
  "vehicle": { "plate": "ABC1D23", "model": "Fiat Argo", "size": "sedan" },
  "startsAt": "2026-07-24T14:00:00-03:00",
  "serviceVariantIds": ["…", "…", "…"]
}
```

O cliente **não envia** duração nem preço. O servidor recalcula tudo a partir dos IDs. Confiar em valores vindos do cliente permitiria agendar um polimento pelo preço de uma lavagem simples.

| Status | Situação |
|---|---|
| `201` | Criado, retorna o agendamento com itens |
| `400` | Payload inválido (Zod) |
| `409` | Horário indisponível (violação da constraint) |
| `422` | Regra de negócio violada (sem serviço base, fora do horário) |

### `PATCH /api/appointments/:id/status`

```json
{ "status": "confirmed" }
```

Valida a transição no servidor. Retorna `422` se a transição for inválida.

### `DELETE /api/appointments/:id`

Exclusão definitiva. Requer autenticação de admin.

### `PATCH /api/appointments/:id/items/:itemId`

```json
{ "completed": true }
```

Marca um item do checklist como executado.

### `POST /api/auth/session`

Recebe o ID token do Firebase, valida com o Admin SDK, verifica a claim `admin` e emite o session cookie httpOnly.

---

## 6. Autenticação e autorização

```
1. Login no client        → Firebase Auth (e-mail/senha)
2. ID token               → POST /api/auth/session
3. Servidor               → admin.auth().verifyIdToken(token)
4. Verifica claim         → decoded.admin === true ?
5. Emite cookie           → httpOnly, secure, sameSite=lax, 5 dias
6. proxy.ts               → valida o cookie em /admin/*
```

**Por que session cookie e não o ID token direto:** o ID token expira em 1 hora e vive no client. O session cookie é httpOnly, inacessível a JavaScript, e permite validar no servidor antes de renderizar, eliminando o flash de conteúdo não autorizado.

**Por que custom claim e não lista de e-mails:** uma lista no front-end é contornável em cinco segundos com o DevTools. A claim é assinada pelo Firebase e verificada no servidor.

---

## 7. Estratégia de testes

| Camada | Ferramenta | O que testa |
|---|---|---|
| Serviços de domínio | Vitest | Disponibilidade, precificação, transição de status |
| Componentes | Testing Library | Carrinho, formulário, grade |
| Integração | Vitest | Route Handlers com banco de teste |
| Constraint | SQL direto | Que a sobreposição realmente falha |

**Prioridade:** os testes de `availability.ts` são os que importam. É a regra mais crítica e a mais fácil de quebrar em refatoração. Casos cobertos:

- Slot no passado é rejeitado
- Slot dentro da antecedência mínima é rejeitado
- Slot que não cabe antes do fechamento é rejeitado
- Slot sobreposto a agendamento existente é rejeitado
- Slot sobreposto a agendamento **cancelado** é aceito
- Buffer é respeitado entre atendimentos
- Domingo retorna lista vazia
- Sábado usa jornada reduzida
- Duração maior reduz o número de slots disponíveis

---

## 8. Riscos técnicos conhecidos

| Risco | Mitigação |
|---|---|
| `firebase-admin@14` puxa `jose@6` e quebra o build com `ERR_REQUIRE_ESM` | Build com flag `--webpack` e override da versão do `jose` no `package.json` |
| Neon fecha conexão ociosa em serverless | Inicialização lazy do client (`getDb()`), sem conexão no import |
| Hydration mismatch em datas (`toLocaleString`) | Formatação com fuso explícito, idêntica em servidor e cliente |
| Erro de fuso em `America/Sao_Paulo` | Toda aritmética de data no servidor com fuso explícito. Nunca usar o fuso do browser |
| `EXCLUDE USING gist` exige a extensão `btree_gist` | Migration cria a extensão. Validado no Dia 1, antes de qualquer feature |
| Vercel serverless não mantém conexão persistente | Sem WebSocket neste projeto. O painel usa polling do TanStack Query |
