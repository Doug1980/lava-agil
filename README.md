# LavaÁgil

> Seu carro limpo na hora certa.

Sistema de agendamento para lava-rápido e estética automotiva. O cliente monta seu atendimento escolhendo um serviço base e adicionais opcionais, e a grade de horários se recalcula em tempo real conforme a duração total muda.

**Status:** em desenvolvimento (Dia 1 de 5)

| | |
|---|---|
| Aplicação em produção | _pendente, publicado no Dia 5_ |
| Repositório | https://github.com/Doug1980/lava-agil |
| Desenvolvedor | Douglas Salazar |

---

## Sumário

- [O problema](#o-problema)
- [O diferencial](#o-diferencial)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Ferramentas de IA utilizadas](#ferramentas-de-ia-utilizadas)
- [Como executar localmente](#como-executar-localmente)
- [Credenciais de acesso](#credenciais-de-acesso)
- [Decisões técnicas](#decisões-técnicas)
- [Documentação completa](#documentação-complementar)

---

## O problema

Um lava-rápido opera com um único box de atendimento. Enquanto um veículo está no box, nenhum outro pode entrar. A agenda existe para proteger esse recurso escasso de overbooking.

A dificuldade é que **a duração de um atendimento não é conhecida de antemão**. Ela depende de três variáveis:

1. O serviço base escolhido (lavagem simples, completa, polimento);
2. O porte do veículo (hatch, sedan, SUV/picape);
3. Os adicionais selecionados (pretinho, cera, higienização interna, etc).

Isso significa que a grade de horários não é uma propriedade fixa do dia. Ela é uma **função do que o cliente montou**.

## O diferencial

A maioria dos sistemas de agendamento trata o serviço como um campo decorativo: o cliente escolhe um `<select>` e a grade de horários não muda. No LavaÁgil, o serviço reconfigura a disponibilidade inteira.

**Fluxo do cliente:**

```
1. Porte do veículo    →  hatch, sedan ou SUV/picape
2. Serviço base        →  obrigatório, exatamente um
3. Adicionais          →  opcionais, quantos quiser
4. Duração e valor     →  calculados ao vivo
5. Grade de horários   →  recalculada, só mostra o que cabe
6. Confirmação         →  gera a Ordem de Serviço
```

Na prática, para um Sedan:

| Item | Duração | Valor |
|---|---:|---:|
| Lavagem completa | 40min | R$ 70,00 |
| + Higienização interna | 45min | R$ 150,00 |
| + Pretinho nos pneus | 15min | R$ 20,00 |
| + Cera de proteção | 15min | R$ 30,00 |
| **Total** | **115min** | **R$ 270,00** |

Com 115 minutos, os horários a partir das 16:05 desaparecem da grade, porque o atendimento não caberia antes do fechamento às 18:00. Se o cliente desmarcar a higienização, a duração cai para 70min e esses horários reaparecem na tela, sem recarregar a página.

**Ordem de Serviço:** o checklist montado pelo cliente é persistido e vira a OS que o administrador vê quando o veículo chega. Nada precisa ser explicado no balcão, já está tudo acordado e registrado.

---

## Tecnologias utilizadas

### Front-end
| Tecnologia | Uso |
|---|---|
| Next.js (App Router) | Framework full stack, SSR e Route Handlers |
| TypeScript | Tipagem estática ponta a ponta |
| Tailwind CSS | Estilização utilitária e responsividade |
| shadcn/ui | Componentes acessíveis sobre Radix UI |
| React Hook Form | Gerenciamento de formulários |
| Zod | Validação de schemas, compartilhada com o back-end |
| TanStack Query | Cache e sincronização de estado do servidor |
| Lucide React | Ícones |

### Back-end
| Tecnologia | Uso |
|---|---|
| Next.js Route Handlers | Camada de API REST |
| Drizzle ORM | Acesso ao banco com tipos inferidos do schema |
| PostgreSQL (Neon) | Persistência, com constraint de exclusão temporal |
| Firebase Auth | Autenticação da área administrativa |
| firebase-admin | Verificação de token e session cookies no servidor |
| Nodemailer | Envio de e-mail de confirmação e redefinição de senha |

### Qualidade e infraestrutura
| Tecnologia | Uso |
|---|---|
| Vitest | Testes unitários das regras de negócio |
| Testing Library | Testes de componentes |
| ESLint + Prettier | Padronização de código |
| Vercel | Deploy e CI |

---

## Ferramentas de IA utilizadas

O desafio permite e incentiva o uso de IA. Este projeto usou IA de forma deliberada e documentada, com revisão humana em todas as etapas.

**Resumo:** Claude (Anthropic) foi usado como par técnico ao longo de todo o desenvolvimento, principalmente em levantamento de requisitos, discussão de arquitetura, geração de boilerplate e revisão de código. Nenhum código foi aceito sem leitura e entendimento.

O detalhamento completo, incluindo o que a IA acertou, onde errou e o que foi rejeitado, está em **[docs/AI_USAGE.md](./docs/AI_USAGE.md)**.

---

## Como executar localmente

### Pré-requisitos

- Node.js 20 ou superior
- pnpm 9 ou superior (ou npm)
- Uma conta gratuita no [Neon](https://neon.tech) (PostgreSQL)
- Um projeto no [Firebase](https://console.firebase.google.com) com Authentication habilitado

### 1. Clonar e instalar

```bash
git clone https://github.com/Doug1980/lava-agil.git
cd lava-agil
pnpm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha o `.env.local`:

```env
# Banco de dados (Neon)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""

# Firebase Admin SDK (server)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""

# E-mail (Gmail SMTP com App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
MAIL_FROM="LavaÁgil <nao-responda@exemplo.com>"

# Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Atenção ao `FIREBASE_PRIVATE_KEY`:** a chave contém quebras de linha. Ao colar no `.env.local`, envolva em aspas duplas e mantenha os `\n` literais. O código faz `replace(/\\n/g, '\n')` na leitura.

### 3. Banco de dados

```bash
pnpm db:push      # aplica o schema
pnpm db:seed      # popula o catálogo de serviços e variantes
```

### 4. Criar o usuário administrador

```bash
pnpm admin:create -- --email=admin@exemplo.com --password=SenhaForte123
```

O script cria o usuário no Firebase Auth e atribui a custom claim `admin: true`.

### 5. Executar

```bash
pnpm dev
```

| Área | URL |
|---|---|
| Cliente | http://localhost:3000 |
| Administrativo | http://localhost:3000/admin |

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor de produção |
| `pnpm lint` | ESLint |
| `pnpm test` | Testes unitários |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm db:push` | Aplica o schema no banco |
| `pnpm db:seed` | Popula os dados iniciais |
| `pnpm db:studio` | Interface visual do Drizzle |

---

## Credenciais de acesso

**Área do cliente:** não requer autenticação.

**Área administrativa:** credenciais de demonstração para avaliação.

| Campo | Valor |
|---|---|
| URL | _pendente, publicado no Dia 5_ |
| E-mail | _pendente_ |
| Senha | _pendente_ |

> O usuário de demonstração tem permissão total sobre os agendamentos. Os dados são fictícios e populados via seed.

---

## Decisões técnicas

Um resumo das cinco decisões mais relevantes. O racional completo, com alternativas consideradas e consequências, está em **[docs/DECISIONS.md](./docs/DECISIONS.md)**.

### 1. Monolito Next.js em vez de front e back separados

Com prazo de 5 dias, uma API separada adicionaria configuração de CORS, um segundo deploy e um segundo pipeline, sem ganho de avaliação. A separação entre cliente e administrador foi resolvida com route groups (`(client)` e `(admin)`), que dão isolamento de layout e de middleware sem custo de infraestrutura.

### 2. PostgreSQL com constraint de exclusão temporal

Este é o coração do projeto. Verificar disponibilidade em JavaScript ("consulta se existe, se não existe insere") falha sob concorrência, porque duas requisições simultâneas consultam antes de qualquer uma inserir. A validação no front-end é UX, não integridade.

A garantia real está no banco:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT appointments_no_overlap
EXCLUDE USING gist (
  tstzrange(starts_at, ends_at) WITH &&
) WHERE (status <> 'cancelled');
```

Sobreposição de horários torna-se **fisicamente impossível de gravar**, independente de quantas requisições cheguem ao mesmo tempo. A API captura a violação e responde `409 Conflict`, e o front-end informa que o horário acabou de ser preenchido e recarrega a grade.

O `WHERE (status <> 'cancelled')` é o detalhe fino: um agendamento cancelado sai da constraint e devolve o horário para a grade automaticamente, sem código adicional.

Um índice único em `(starts_at)` não resolveria o problema, porque agendamentos de durações diferentes se sobrepõem sem começar no mesmo instante.

### 3. Duração como dado, não como lógica

Serviços base e adicionais vivem na mesma tabela, diferenciados por um campo `kind`. Cada um tem uma variante por porte de veículo, com duração e preço próprios.

```
services          → id, name, kind ('base' | 'addon')
service_variants  → service_id, vehicle_size, duration_minutes, price_cents
```

A duração total é `soma dos itens escolhidos`. Não existe uma única condicional de negócio calculando tempo. A complexidade mora no dado, que é onde ela deve morar, e o código fica trivial de testar.

### 4. Snapshot de preço e duração nos itens

Cada item de um agendamento guarda uma cópia do nome, duração e preço vigentes no momento da reserva. Se o dono reajustar a tabela amanhã, os agendamentos de ontem não mudam de valor retroativamente. É o mesmo princípio de um pedido de e-commerce.

### 5. Firebase Auth com session cookie httpOnly

O login acontece no client via Firebase Auth. O ID token é enviado ao servidor, que o valida com o Admin SDK e emite um **session cookie httpOnly**. Isso permite proteger as rotas administrativas no servidor, eliminando o flash de conteúdo não autorizado.

A autorização usa a custom claim `admin: true`, atribuída pelo Admin SDK. Nunca uma lista de e-mails no front-end, que seria trivialmente contornável.

---

## Documentação complementar

| Documento | Conteúdo |
|---|---|
| [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) | Requisitos, premissas assumidas e regras de negócio |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Estrutura de pastas, modelo de dados e contratos da API |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Registro de decisões arquiteturais (ADRs) |
| [docs/AI_USAGE.md](./docs/AI_USAGE.md) | Uso de IA no desenvolvimento |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Planejamento das 5 etapas de execução |

---

## Licença

MIT
