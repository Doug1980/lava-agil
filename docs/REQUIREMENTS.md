# Requisitos

Este documento separa o que foi **explicitamente pedido** no desafio, o que foi **assumido** para preencher lacunas do enunciado, e o que foi **adicionado** como diferencial.

A distinção importa: um enunciado vago não é um convite para adivinhar, é um convite para decidir e documentar a decisão.

---

## 1. Requisitos explícitos

### RF-01 · Área do Cliente

| ID | Requisito | Origem |
|---|---|---|
| RF-01.1 | Agendar um serviço | Enunciado |
| RF-01.2 | Informar nome, telefone, serviço, data e horário | Enunciado |
| RF-01.3 | Visualizar a confirmação do agendamento | Enunciado |
| RF-01.4 | Consultar os horários disponíveis | Enunciado |
| RF-01.5 | Não conseguir selecionar horários já ocupados | Enunciado |

### RF-02 · Área Administrativa

| ID | Requisito | Origem |
|---|---|---|
| RF-02.1 | Visualizar todos os agendamentos | Enunciado |
| RF-02.2 | Visualizar os dados dos clientes | Enunciado |
| RF-02.3 | Filtrar os agendamentos por data | Enunciado |
| RF-02.4 | Alterar o status (Agendado, Confirmado, Concluído, Cancelado) | Enunciado |
| RF-02.5 | Cancelar agendamentos | Enunciado |
| RF-02.6 | Excluir agendamentos | Enunciado |

### RNF · Requisitos não funcionais

| ID | Requisito | Origem |
|---|---|---|
| RNF-01 | Interface responsiva | Enunciado |
| RNF-02 | Persistência dos dados | Enunciado |
| RNF-03 | Validação básica dos formulários | Enunciado |
| RNF-04 | Organização e boas práticas de código | Enunciado |
| RNF-05 | Separação entre visão do cliente e visão administrativa | Enunciado |
| RNF-06 | Deploy público em produção | Enunciado |
| RNF-07 | README com tecnologias, IA, execução local, credenciais e decisões | Enunciado |

---

## 2. Premissas assumidas

O enunciado é deliberadamente aberto. Onde ele não define, assumimos e registramos aqui.

### 2.1 Domínio de negócio

> **LavaÁgil** é um lava-rápido com estética automotiva, operando com **um único box de atendimento** e uma equipe de quatro atendentes que trabalham **em paralelo no mesmo veículo**.

Essa premissa tem duas consequências diretas:

- **Um box significa uma agenda.** Dois veículos nunca ocupam o mesmo intervalo. É isso que justifica a constraint de exclusão temporal.
- **Equipe em paralelo significa durações curtas.** Uma lavagem completa leva 40 minutos porque enquanto um atendente enxagua, outro já aplica produto e um terceiro seca. Isso gera uma grade densa e viva, em vez de quatro blocos de três horas.

Note que o paralelismo é **dentro** do slot, não **entre** slots. Se cada atendente lavasse um carro diferente, o modelo seria agenda por recurso, e a complexidade dobraria. Não é o caso.

### 2.2 Horário de funcionamento

| Item | Valor |
|---|---|
| Dias | Segunda a sábado |
| Horário (seg a sex) | 09:00 às 18:00 |
| Horário (sábado) | 09:00 às 13:00 |
| Domingo | Fechado |
| Granularidade da grade | 15 em 15 minutos |
| Fuso horário | `America/Sao_Paulo`, fixo |

**Por que 15 minutos:** existem adicionais de 15min no catálogo (pretinho, cera). Uma grade de 30 desperdiçaria metade do encaixe possível. Com 15min, o intervalo de 09:00 às 18:00 gera 36 slots por dia.

**Por que fuso fixo:** o horário de funcionamento é uma propriedade do estabelecimento, não do navegador do cliente. Um cliente acessando de Portugal deve ver a mesma grade que um cliente em São Paulo. O fuso do browser nunca é usado para cálculo de disponibilidade.

### 2.3 Regras de agendamento

| ID | Regra |
|---|---|
| RN-01 | Não é possível agendar no passado |
| RN-02 | Antecedência mínima de 60 minutos |
| RN-03 | Antecedência máxima de 60 dias |
| RN-04 | O atendimento deve caber integralmente dentro do horário de funcionamento do dia |
| RN-05 | Exatamente **um** serviço base é obrigatório |
| RN-06 | **Zero ou mais** adicionais podem ser escolhidos |
| RN-07 | Buffer de 10 minutos entre atendimentos |
| RN-08 | Um agendamento cancelado libera o horário de volta para a grade |
| RN-09 | Dois agendamentos não cancelados nunca podem se sobrepor no tempo |

**Sobre o buffer (RN-07):** representa o tempo real de retirar o veículo do box, secar o piso e posicionar o próximo. O cliente vê "14:00 às 15:55", mas o box fica reservado até 16:05. Custa uma constante no cálculo de `ends_at` e torna o sistema crível.

### 2.4 Cancelar não é excluir

O enunciado lista as duas ações separadamente (RF-02.5 e RF-02.6), então tratamos como operações distintas:

| Ação | Efeito | Reversível |
|---|---|---|
| **Cancelar** | Muda `status` para `cancelled`. Preserva o registro e o histórico. Libera o slot. | Sim |
| **Excluir** | Remove o registro do banco. Exige confirmação explícita. | Não |

Cancelar é operação de negócio. Excluir é operação de manutenção, para lidar com registros de teste ou spam.

### 2.5 Máquina de estados do agendamento

```
                  ┌──────────────┐
                  │  scheduled   │  (Agendado)
                  └──────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼                     ▼
       ┌─────────────┐       ┌─────────────┐
       │  confirmed  │──────▶│  cancelled  │
       │ (Confirmado)│       │ (Cancelado) │
       └──────┬──────┘       └─────────────┘
              │                     ▲
              ▼                     │
       ┌─────────────┐              │
       │  completed  │              │
       │ (Concluído) │              │
       └─────────────┘              │
                                    │
       scheduled ───────────────────┘
```

| De | Para | Permitido |
|---|---|---|
| `scheduled` | `confirmed`, `cancelled` | Sim |
| `confirmed` | `completed`, `cancelled` | Sim |
| `completed` | qualquer | Não, estado terminal |
| `cancelled` | qualquer | Não, estado terminal |

As transições são validadas no servidor. O front-end apenas desabilita os botões inválidos, o que é UX, não segurança.

### 2.6 Catálogo de serviços

**Portes de veículo:** `hatch`, `sedan`, `suv` (SUV/picape).

#### Serviços base (obrigatório escolher um)

| Serviço | Hatch | Sedan | SUV/Picape |
|---|---|---|---|
| Lavagem simples | 20min · R$ 35 | 25min · R$ 45 | 30min · R$ 55 |
| Lavagem completa | 35min · R$ 60 | 40min · R$ 70 | 50min · R$ 90 |
| Polimento técnico | 80min · R$ 280 | 90min · R$ 320 | 110min · R$ 390 |

#### Adicionais (opcionais)

| Adicional | Hatch | Sedan | SUV/Picape |
|---|---|---|---|
| Pretinho nos pneus | 15min · R$ 20 | 15min · R$ 20 | 20min · R$ 25 |
| Cera de proteção | 15min · R$ 30 | 15min · R$ 30 | 20min · R$ 40 |
| Higienização interna | 40min · R$ 130 | 45min · R$ 150 | 55min · R$ 180 |
| Motor lavado | 20min · R$ 40 | 20min · R$ 40 | 25min · R$ 50 |
| Cristalização de vidros | 20min · R$ 80 | 25min · R$ 90 | 30min · R$ 110 |

Total: 8 serviços × 3 portes = **24 linhas** em `service_variants`.

O polimento técnico está no catálogo de propósito: é o serviço que estoura a grade no fim da tarde e demonstra visualmente que o cálculo de disponibilidade funciona.

---

## 3. Diferenciais adicionados

Funcionalidades além do enunciado, escolhidas por agregarem valor sem comprometer o prazo.

| ID | Diferencial | Justificativa |
|---|---|---|
| RD-01 | Serviço base + adicionais com duração e preço calculados | Transforma o serviço de campo decorativo em variável que reconfigura a disponibilidade |
| RD-02 | Grade de horários reativa à duração do carrinho | Demonstra que disponibilidade é relativa ao que o cliente montou |
| RD-03 | Ordem de Serviço persistida com checklist | O admin sabe exatamente o que fazer quando o veículo chega |
| RD-04 | Checklist de execução item a item no admin | Vai um nível abaixo do "alterar status" pedido, sem tabela nova |
| RD-05 | Constraint de exclusão temporal no banco | Overbooking impossível de gravar, mesmo sob concorrência |
| RD-06 | Snapshot de preço e duração nos itens | Reajuste de tabela não reescreve o histórico |
| RD-07 | Validação compartilhada front/back com Zod | Fonte única de verdade, sem regra duplicada |
| RD-08 | Máscara e validação de telefone brasileiro | UX |
| RD-09 | E-mail de confirmação para o cliente | Complementa o requisito RF-01.3 |
| RD-10 | Testes automatizados das regras de disponibilidade | A regra mais crítica do sistema não pode depender de teste manual |
| RD-11 | Estados de loading, vazio e erro tratados | Critério explícito de avaliação (experiência do usuário) |
| RD-12 | Acessibilidade básica (labels, foco visível, navegação por teclado) | Boa prática |
| RD-13 | Tema claro e escuro | UX |

---

## 4. Fora de escopo

Registrado explicitamente para proteger o prazo. Não são esquecimentos, são cortes conscientes.

| Item | Motivo |
|---|---|
| Múltiplos boxes em paralelo | Quebraria a constraint de exclusão simples e dobraria a complexidade da grade |
| Regras de incompatibilidade entre adicionais | Viraria um grafo de dependências. Custo alto, ganho baixo |
| Pagamento online | Fora do enunciado |
| Área de login do cliente | O enunciado pede agendamento sem cadastro |
| Cadastro e gestão de múltiplos admins | O enunciado não pede. Um admin via script basta |
| Notificação por WhatsApp/SMS | Custo de integração e conta paga |
| Reagendamento pelo cliente | Não pedido. O cancelamento cobre o caso de uso |
| App mobile nativo | Responsividade web atende |

---

## 5. Rastreabilidade

Cada requisito será marcado como concluído aqui conforme o desenvolvimento avança.

| Requisito | Status | Etapa |
|---|---|---|
| RF-01.1 a RF-01.5 | Pendente | D3 |
| RF-02.1 a RF-02.6 | Pendente | D4 |
| RNF-01 | Pendente | D3, D4 |
| RNF-02 | Pendente | D1 |
| RNF-03 | Pendente | D2, D3 |
| RNF-04 | Contínuo | D1 a D5 |
| RNF-05 | Pendente | D1 |
| RNF-06 | Pendente | D5 |
| RNF-07 | Em andamento | D1, D5 |
