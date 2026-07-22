# LavaÁgil

> Seu carro limpo na hora certa.

Sistema de agendamento para lava-rápido e estética automotiva. O cliente monta seu atendimento escolhendo um serviço base e adicionais opcionais, e a grade de horários se recalcula em tempo real conforme a duração total muda.

**Status:** concluído e publicado em produção.

| | |
|---|---|
| Aplicação em produção | https://lava-agil.vercel.app |
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
- [Documentação complementar](#documentação-complementar)

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

**Fluxo do cliente (sem cadastro):**

```
1. Porte do veículo    →  hatch, sedan ou SUV/picape
2. Serviço base        →  obrigatório, exatamente um
3. Adicionais          →  opcionais, quantos quiser
4. Data                →  calendário
5. Horário             →  grade reativa, só mostra o que cabe
6. Seus dados          →  nome, telefone, e-mail e veículo
7. Confirmação         →  código do agendamento + e-mail
```

A tela do cliente é um **painel único com resumo vivo**: à medida que ele monta o atendimento, a duração, o valor e a grade de horários se atualizam ao lado, em tempo real. A grade só aparece depois que serviço e data estão escolhidos, então nunca oferecemos um horário sem saber a duração.

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

**Acompanhamento sem login:** ao confirmar, o cliente recebe um **código** (ex.: `LA-JC7U8V`) na tela e por e-mail. Esse código é guardado no navegador, e a área **"Meus agendamentos"** lista os atendimentos com o status ao vivo (que muda de cor quando o administrador confirma, conclui ou cancela). Quem trocou de aparelho consulta pelo código.

---

## Tecnologias utilizadas

### Front-end
| Tecnologia | Uso |
|---|---|
| Next.js 16 (App Router, Turbopack) | Framework full stack, SSR e Route Handlers |
| TypeScript | Tipagem estática ponta a ponta |
| Tailwind CSS v4 | Estilização utilitária e responsividade |
| shadcn/ui (Radix UI) | Componentes acessíveis |
| React Hook Form + Zod | Formulários e validação, schema compartilhado com o back-end |
| TanStack Query | Cache e sincronização de estado do servidor |
| date-fns + @date-fns/tz | Datas no fuso do estabelecimento (ver ADR-007) |
| Lucide React · sonner | Ícones e toasts |

### Back-end
| Tecnologia | Uso |
|---|---|
| Next.js Route Handlers | Camada de API REST |
| Drizzle ORM | Acesso ao banco com tipos inferidos do schema |
| PostgreSQL (Neon) | Persistência, com constraint de exclusão temporal |
| Firebase Auth | Autenticação da área administrativa |
| firebase-admin 12 | Verificação de token e session cookies no servidor |
| Nodemailer (Gmail SMTP) | E-mail de confirmação do agendamento |

### Qualidade e infraestrutura
| Tecnologia | Uso |
|---|---|
| Vitest | Testes unitários das regras de negócio (disponibilidade, preço, status) |
| Biome | Lint e formatação |
| Vercel | Deploy e CI (Node 22.x) |

---

## Ferramentas de IA utilizadas

O desafio permite e incentiva o uso de IA. Este projeto usou IA de forma deliberada e documentada, com revisão humana em todas as etapas.

**Resumo:** Claude (Anthropic) foi usado como par técnico ao longo de todo o desenvolvimento, principalmente em levantamento de requisitos, discussão de arquitetura, geração de boilerplate, revisão de código e depuração (incluindo a resolução do `ERR_REQUIRE_ESM` no deploy). Nenhum código foi aceito sem leitura e entendimento.

O detalhamento completo, incluindo o que a IA acertou, onde errou e o que foi rejeitado, está em **[docs/AI_USAGE.md](./docs/AI_USAGE.md)**.

---

## Como executar localmente

### Pré-requisitos

- Node.js 22.x
- pnpm (ou npm)
- Uma conta gratuita no [Neon](https://neon.tech) (PostgreSQL)
- Um projeto no [Firebase](https://console.firebase.google.com) com Authentication (e-mail/senha) habilitado
- Uma conta Gmail com **Senha de app** (para o envio de e-mail) — opcional

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
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase Admin SDK (server)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""

# Quem é admin (lista separada por vírgula)
ADMIN_EMAILS="admin@exemplo.com"

# E-mail de confirmação (Gmail SMTP com Senha de app) — opcional
SMTP_USER="contato.exemplo@gmail.com"
SMTP_PASSWORD="senha-de-app-de-16-digitos"
MAIL_FROM="LavaÁgil <contato.exemplo@gmail.com>"

# Opcional (usado no link/logo do e-mail; sem isto, cai na URL da requisição)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Atenção ao `FIREBASE_PRIVATE_KEY`:** a chave contém quebras de linha. Ao colar no `.env.local`, envolva em aspas duplas e mantenha os `\n` literais. O código faz `replace(/\\n/g, '\n')` na leitura. No painel da Vercel, cole o mesmo conteúdo **sem** as aspas externas.

> **E-mail:** se `SMTP_USER`/`SMTP_PASSWORD` não forem preenchidos, o agendamento funciona normalmente e o envio é apenas pulado. Em modo pessoal (sem domínio próprio verificado), o e-mail sai a partir da sua conta Gmail.

### 3. Banco de dados

```bash
pnpm db:push      # aplica o schema (inclui a constraint de exclusão temporal)
pnpm db:seed      # popula o catálogo de serviços e variantes
```

### 4. Criar o usuário administrador

Não há área de cadastro. O administrador é criado direto no **Firebase Console → Authentication → Users → Add user** (e-mail e senha). Em seguida, adicione esse e-mail à variável `ADMIN_EMAILS`. Um usuário logado cujo e-mail **não** está em `ADMIN_EMAILS` é tratado como cliente comum e barrado do painel e das rotas administrativas.

### 5. Executar

```bash
pnpm dev
```

| Área | URL |
|---|---|
| Cliente (público) | http://localhost:3000 |
| Administrativo | http://localhost:3000/entrar |

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor de produção |
| `pnpm test` | Testes unitários |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm db:push` | Aplica o schema no banco |
| `pnpm db:seed` | Popula os dados iniciais |
| `pnpm db:studio` | Interface visual do Drizzle |

---

## Credenciais de acesso

**Área do cliente:** não requer autenticação. O agendamento é anônimo — o cliente informa nome, telefone, e-mail e veículo, e acompanha pelo código.

**Área administrativa:** credenciais de demonstração para avaliação.

| Campo | Valor |
|---|---|
| URL | https://lava-agil.vercel.app/entrar |
| E-mail | `admin_master@hotmail.com` |
| Senha | `112233@445566` |

> O usuário administrador tem permissão total sobre os agendamentos.

---

## Decisões técnicas

Um resumo das decisões mais relevantes. O racional completo, com alternativas consideradas e consequências, está em **[docs/DECISIONS.md](./docs/DECISIONS.md)**.

### 1. Monolito Next.js em vez de front e back separados

Com o escopo do desafio, uma API separada adicionaria configuração de CORS, um segundo deploy e um segundo pipeline, sem ganho de avaliação. A separação entre cliente e administrador é resolvida por **rota** (`/agendar` e `/meus-agendamentos` públicas; `/admin` e as rotas de API sensíveis protegidas no servidor), com o mesmo modelo de tipos compartilhado entre as duas pontas.

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

### 3. Duração como dado, não como lógica

Serviços base e adicionais vivem na mesma tabela, diferenciados por um campo `kind`. Cada um tem uma variante por porte de veículo, com duração e preço próprios. A duração total é a soma dos itens escolhidos — não existe condicional de negócio calculando tempo. A complexidade mora no dado, e o código fica trivial de testar.

### 4. Snapshot de preço e duração nos itens

Cada item de um agendamento guarda uma cópia do nome, duração e preço vigentes no momento da reserva. Se o dono reajustar a tabela amanhã, os agendamentos de ontem não mudam de valor retroativamente. É o mesmo princípio de um pedido de e-commerce.

### 5. Autenticação: Firebase Auth + session cookie + allowlist no servidor

O login (admin) acontece no client via Firebase Auth. O ID token é enviado ao servidor, que o valida com o Admin SDK e emite um **session cookie httpOnly**, permitindo proteger as rotas no servidor sem flash de conteúdo não autorizado.

A **autorização** usa uma allowlist de e-mails (`ADMIN_EMAILS`) lida do ambiente e verificada **no servidor** (em server components e Route Handlers via `requireAdmin`) — nunca confiando em nada vindo do cliente. É uma escolha simples e adequada a um único operador; a evolução natural (custom claims / hierarquia de papéis) está registrada como trabalho futuro nos ADRs.

### 6. Cliente anônimo e acompanhamento por código

O enunciado descreve o cliente sem cadastro, então o agendamento é **público**. Para que o cliente não fique "na mão" ao atualizar a página, cada agendamento gera um código não sequencial (`LA-` + 6 caracteres) que é guardado no navegador (`localStorage`) e enviado por e-mail. A área "Meus agendamentos" busca o status ao vivo por esse código num endpoint público que devolve **apenas dados não sensíveis** (sem telefone, placa ou e-mail).

### 7. Deploy: firebase-admin 12 para evitar `ERR_REQUIRE_ESM`

No runtime serverless da Vercel, o `firebase-admin@14` puxa `jwks-rsa@4 → jose@6` (ESM-only), e o `require()` dessa cadeia quebra com `ERR_REQUIRE_ESM` — apesar de funcionar no dev local. A solução foi fixar o `firebase-admin@12`, cuja cadeia usa `jose@4` (CommonJS), eliminando o problema na raiz. O projeto também fixa o Node em `22.x` (`engines`).

---

## Documentação complementar

| Documento | Conteúdo |
|---|---|
| [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) | Requisitos, premissas assumidas e regras de negócio |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Estrutura de pastas, modelo de dados e contratos da API |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Registro de decisões arquiteturais (ADRs) |
| [docs/AI_USAGE.md](./docs/AI_USAGE.md) | Uso de IA no desenvolvimento |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Planejamento das etapas de execução |

---

## Licença

MIT
