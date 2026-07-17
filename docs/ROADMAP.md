# Roadmap

**Início:** 17/07/2026 · **Prazo:** 5 dias · **Disponibilidade:** 8h/dia · **Total:** 40h

Cada etapa termina com uma revisão e uma aprovação explícita antes de seguir para a próxima. O deploy acontece apenas no Dia 5, mas o `build` de produção roda localmente desde o Dia 1, para não descobrir problema de build na véspera da entrega.

---

## Visão geral

| Dia | Foco | Entregável verificável |
|---|---|---|
| **D1** | Requisitos, arquitetura, documentação, setup, banco | Docs completos, banco no ar, constraint testada com concorrência real |
| **D2** | Núcleo do domínio e API | Serviço de disponibilidade testado, endpoints funcionando via HTTP |
| **D3** | Área do cliente | Fluxo de agendamento completo e responsivo |
| **D4** | Área administrativa | Painel completo com auth, filtro, status e checklist |
| **D5** | Revisão, testes, deploy | Aplicação em produção validada |

---

## D1 · Fundação

**Objetivo:** ter certeza de que a decisão mais arriscada do projeto funciona, antes de construir qualquer coisa em cima dela.

| # | Tarefa | Horas |
|---|---|---|
| 1.1 | Levantamento de requisitos e premissas | 1,0 |
| 1.2 | Definição de arquitetura e stack | 1,0 |
| 1.3 | Documentação: README, REQUIREMENTS, ARCHITECTURE, DECISIONS, AI_USAGE, ROADMAP | 1,5 |
| 1.4 | Setup: Next.js, TypeScript, Tailwind, shadcn/ui, ESLint, Prettier | 1,0 |
| 1.5 | Estrutura de pastas e route groups `(client)` / `(admin)` | 0,5 |
| 1.6 | Neon: projeto, `DATABASE_URL`, conexão lazy | 0,5 |
| 1.7 | Schema Drizzle e migrations | 1,0 |
| 1.8 | **Migration da constraint `EXCLUDE USING gist`** | 0,5 |
| 1.9 | **Teste de concorrência real: dois inserts simultâneos** | 0,5 |
| 1.10 | Seed do catálogo (8 serviços × 3 portes) | 0,5 |
| | **Total** | **8,0** |

**Critério de conclusão do D1:**
- [ ] Documentação revisada e aprovada
- [ ] `pnpm db:push` e `pnpm db:seed` executam sem erro
- [ ] `pnpm build` passa
- [ ] Dois `INSERT` sobrepostos simultâneos: um passa, o outro falha com violação de constraint
- [ ] Commit inicial com histórico semântico

> **Por que a constraint é a primeira coisa a testar:** é a decisão mais arriscada e a mais cara de descobrir errada. Se `btree_gist` não estiver disponível no Neon, ou se a sintaxe do `EXCLUDE` com `WHERE` não funcionar como esperado, quero saber na hora 8 do projeto, não na hora 30. Tudo o mais é construído sobre essa garantia.

---

## D2 · Núcleo do domínio e API

**Objetivo:** a regra de negócio funcionando e testada, sem uma linha de interface.

| # | Tarefa | Horas |
|---|---|---|
| 2.1 | Schemas Zod compartilhados | 0,5 |
| 2.2 | Constantes de negócio (jornada, buffer, granularidade, antecedência) | 0,5 |
| 2.3 | `server/services/availability.ts` (função pura) | 1,5 |
| 2.4 | `server/services/pricing.ts` (soma de itens) | 0,5 |
| 2.5 | `server/services/status.ts` (máquina de estados) | 0,5 |
| 2.6 | **Testes Vitest dos três serviços** | 1,5 |
| 2.7 | `GET /api/services` | 0,5 |
| 2.8 | `GET /api/availability` | 0,5 |
| 2.9 | `POST /api/appointments` com tratamento de `409` | 1,0 |
| 2.10 | `GET /api/appointments`, `GET /:id`, `DELETE /:id` | 0,5 |
| 2.11 | `PATCH /:id/status` e `PATCH /:id/items/:itemId` | 0,5 |
| | **Total** | **8,0** |

**Critério de conclusão do D2:**
- [ ] Testes passando, cobrindo os 9 casos listados em ARCHITECTURE §7
- [ ] Todos os endpoints respondendo corretamente via Thunder Client ou curl
- [ ] `POST` duplicado no mesmo slot retorna `409`
- [ ] Agendamento cancelado libera o horário na consulta de disponibilidade
- [ ] Preço e duração enviados pelo cliente são ignorados pelo servidor

> Nenhuma interface neste dia, e isso é intencional. Se a regra de negócio depende da tela para ser testada, a arquitetura está errada.

---

## D3 · Área do cliente

**Objetivo:** o diferencial do projeto, visível e funcionando.

| # | Tarefa | Horas |
|---|---|---|
| 3.1 | Layout, tema claro/escuro, identidade visual | 1,0 |
| 3.2 | Seletor de porte do veículo | 0,5 |
| 3.3 | Catálogo de serviços base | 0,5 |
| 3.4 | Seletor de adicionais com toggle | 0,5 |
| 3.5 | `use-booking-cart` com duração e valor ao vivo | 1,0 |
| 3.6 | Resumo do carrinho fixo (sticky) | 0,5 |
| 3.7 | Calendário de datas | 0,5 |
| 3.8 | **Grade de horários reativa à duração** | 1,5 |
| 3.9 | Formulário de dados com RHF e Zod | 1,0 |
| 3.10 | Página de confirmação com a OS | 0,5 |
| 3.11 | Estados de loading, vazio e erro | 0,5 |
| | **Total** | **8,0** |

**Critério de conclusão do D3:**
- [ ] Marcar um adicional altera a grade sem recarregar a página
- [ ] Horários indisponíveis aparecem desabilitados com motivo, não sumidos
- [ ] Fluxo completo funciona em 375px de largura
- [ ] Colisão de horário mostra mensagem clara e recarrega a grade
- [ ] Validação de telefone e placa funcionando
- [ ] Navegação por teclado em todo o fluxo

> A tarefa 3.8 é o coração do projeto. É onde a `queryKey` do TanStack Query inclui `durationMinutes` e o refetch acontece sozinho quando o carrinho muda.

---

## D4 · Área administrativa

| # | Tarefa | Horas |
|---|---|---|
| 4.1 | Firebase: projeto, Auth, Admin SDK | 0,5 |
| 4.2 | `POST /api/auth/session` com session cookie | 1,0 |
| 4.3 | `proxy.ts` protegendo `/admin/*` | 0,5 |
| 4.4 | Tela de login | 0,5 |
| 4.5 | `scripts/create-admin.ts` com custom claim | 0,5 |
| 4.6 | Listagem de agendamentos | 1,0 |
| 4.7 | Filtro por data | 0,5 |
| 4.8 | Detalhe do agendamento com dados do cliente e OS | 0,5 |
| 4.9 | Alteração de status com validação de transição | 1,0 |
| 4.10 | Cancelar e excluir com confirmação | 0,5 |
| 4.11 | Checklist de execução item a item | 0,5 |
| 4.12 | Responsividade: tabela em desktop, cards em mobile | 1,0 |
| | **Total** | **8,0** |

**Opcionais, só se sobrar tempo:**
- E-mail de confirmação ao cliente via Nodemailer
- Reset de senha customizado com template próprio
- Indicadores: agendamentos do dia, taxa de ocupação

**Critério de conclusão do D4:**
- [ ] Acessar `/admin` sem sessão redireciona para login, sem flash de conteúdo
- [ ] Usuário sem a claim `admin` não acessa, mesmo autenticado
- [ ] Filtro por data funcionando
- [ ] Transição inválida de status é rejeitada pelo servidor
- [ ] Cancelar libera o horário na grade do cliente
- [ ] Painel usável em mobile

---

## D5 · Revisão, testes e deploy

**Objetivo:** entregar. Com folga para o imprevisto.

| # | Tarefa | Horas |
|---|---|---|
| 5.1 | Revisão geral de código, remoção de morto e `console.log` | 1,0 |
| 5.2 | Auditoria de acessibilidade (labels, foco, contraste) | 0,5 |
| 5.3 | Teste manual do fluxo completo em mobile e desktop | 1,0 |
| 5.4 | Correção dos achados | 1,0 |
| 5.5 | Seed de dados de demonstração para o avaliador | 0,5 |
| 5.6 | Deploy na Vercel com variáveis de ambiente | 1,0 |
| 5.7 | Validação em produção | 0,5 |
| 5.8 | Screenshots em `docs/screenshots/` | 0,5 |
| 5.9 | README final: URL, credenciais, screenshots | 0,5 |
| 5.10 | **Buffer para imprevistos** | 1,5 |
| | **Total** | **8,0** |

**Critério de conclusão do D5:**
- [ ] Aplicação acessível na URL pública
- [ ] Fluxo do cliente funciona em produção
- [ ] Login do admin funciona em produção com as credenciais do README
- [ ] Constraint validada em produção com dois agendamentos concorrentes
- [ ] README com URL, credenciais e screenshots
- [ ] Repositório público
- [ ] Sem segredo commitado (`.env.local` no `.gitignore`)

> **Sobre o buffer de 1,5h:** deploy é onde aparece o que funcionava local e quebra em produção. Variável de ambiente faltando, `FIREBASE_PRIVATE_KEY` com quebra de linha errada, build da Vercel divergindo do local. O buffer não é folga, é previsão.

---

## Gestão de risco

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| `btree_gist` indisponível no Neon | Baixa | Alto | Validado no D1, hora 8. Fallback: `SELECT ... FOR UPDATE` em transação |
| `firebase-admin` quebra o build | Média | Médio | Já conhecido. Flag `--webpack` e override do `jose` documentados no ADR-005 |
| Grade reativa mais complexa que o previsto | Média | Alto | É o diferencial, tem 1,5h dedicada. Se estourar, corta os opcionais do D4 |
| Bug de fuso horário | Média | Médio | Fuso fixo desde o D2, testado no D2 |
| Deploy consome mais que o previsto | Média | Médio | Buffer de 1,5h no D5 |
| Escopo crescer durante o desenvolvimento | **Alta** | Alto | Lista "Fora de escopo" em REQUIREMENTS §4 é contrato comigo mesmo |

**O risco mais provável é o último.** Está tudo registrado justamente para que a tentação de adicionar "só mais uma coisinha" no D4 encontre resistência documentada.

---

## Ordem de corte

Se o prazo apertar, corta nesta ordem, de cima para baixo:

1. Reset de senha customizado
2. E-mail de confirmação ao cliente
3. Indicadores no painel
4. Tema claro/escuro
5. Checklist de execução item a item
6. Testes de componente (os de domínio **não** se cortam)

Nada abaixo da linha 6 é negociável, porque abaixo dela está o enunciado.

---

## Convenção de commits

[Conventional Commits](https://www.conventionalcommits.org/), em inglês, escopo em minúsculo.

```
feat(booking): add addon selection to cart
fix(availability): respect buffer between appointments
test(availability): cover cancelled appointment slot release
docs(adr): record exclusion constraint decision
chore(db): add btree_gist migration
refactor(api): extract appointment mapper
```

Histórico de commits é critério de avaliação implícito. Um commit por tarefa concluída, mensagem que explica o **porquê** quando não for óbvio.
