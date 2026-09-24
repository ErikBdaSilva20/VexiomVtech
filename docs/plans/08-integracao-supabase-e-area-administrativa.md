# 8. Integração com Supabase e área administrativa

Este arquivo resolve as pendências deixadas em [Requisitos técnicos](05-requisitos-tecnicos.md) sobre a estrutura de tabelas, autenticação e permissões, e detalha o plano de implementação da primeira fatia: captação de leads, área administrativa e cases dinâmicos.

## Fundação

- O projeto Supabase já existe (criado fora deste planejamento).
- Não haverá tela pública de cadastro/convite nesta fase. `super_admin` e `employer` são criados manualmente pelos dois fundadores, direto no painel/SQL do Supabase.
- Papéis:
  - `super_admin` — acesso irrestrito.
  - `employer` — acesso apenas ao módulo de leads (ver leads, atualizar status, registrar observações). Não gerencia Cases nem vê dados financeiros.

## Autenticação e autorização

- Supabase Auth (e-mail + senha) alimenta o login em `/painel-8f2k/login`.
- Tabela `admin_users` associa um `auth.users.id` a um `role`. É a fonte da verdade de permissão dentro da aplicação (Supabase Auth por si só não tem conceito de papel).
- Função SQL `app_current_role()` (`SECURITY DEFINER`) lê `admin_users` e é usada dentro das políticas de RLS de outras tabelas — evita recursão de RLS ao consultar a própria `admin_users` dentro de uma policy. (Nomeada `app_current_role()`, não `current_role()`: essa é uma palavra reservada do Postgres — sinônimo de `current_user` — e `current_role()` com parênteses dá erro de sintaxe, inclusive dentro de `CREATE POLICY`. Validado com Postgres real durante a implementação do Epic 1.)
- `middleware.ts` do Next.js protege todo `/painel-8f2k/*`:
  - Sem sessão válida → redireciona para `/painel-8f2k/login`.
  - Sessão válida mas sem permissão para a rota (ex.: `employer` acessando `/painel-8f2k/cases`) → redireciona para `/painel-8f2k/leads`.
- O prefixo `/painel-8f2k` (em vez de `/admin`) é só uma camada extra contra quem tenta adivinhar a URL; a proteção real continua sendo a sessão autenticada e as policies de RLS. Trocar esse nome no futuro é só renomear a pasta de rota no Next.js.

## Modelo de dados

### `leads`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, pk | `gen_random_uuid()` |
| `created_at` | timestamptz | default `now()` |
| `name` | text, not null | |
| `company` | text | opcional |
| `email` | text, not null | |
| `whatsapp` | text, not null | |
| `project_type` | text, not null | enum: `site`, `sistema`, `loja`, `automacao`, `suporte`, `outro` — mesma taxonomia de [SERVICES](../../src/data/home-content.ts) |
| `description` | text, not null | |
| `desired_deadline` | text | opcional, texto livre |
| `budget_range` | text | opcional, texto livre |
| `preferred_channel` | text | opcional |
| `preferred_time` | text | opcional |
| `status` | text, not null | default `novo_lead`; enum conforme a lista de "Status comerciais iniciais" em [Operação comercial](06-operacao-comercial-e-contato.md) |
| `assigned_to` | uuid | referencia `admin_users.user_id`, nullable |
| `viewed_at` | timestamptz | nullable — marcado quando um admin abre o lead |
| `responded_at` | timestamptz | nullable — marcado quando a resposta é enviada |
| `next_action` | text | nullable — o que fazer em seguida (ex.: "ligar", "mandar proposta") |
| `next_action_at` | timestamptz | nullable — data **e horário** do próximo follow-up. Alimenta o alerta chamativo no admin. |
| `probability` | text | nullable, check `in ('baixa', 'media', 'alta')` — o quanto o lead parece perto de fechar |
| `tags` | text[] | nullable — marcações livres (ex.: "quente", "frio", "aguardando orçamento") |
| `non_conversion_reason` | text | nullable — preenchido quando `status = 'nao_convertido'`; motivo registrado pra aprender com o que não fechou |
| `source` | text, not null | default `site`; origem do lead (`site`, `indicacao`, `instagram`, `evento`, `outro`) — permite saber depois qual canal traz cliente bom |
| `created_by` | uuid | nullable, fk → `admin_users.user_id` — quem cadastrou manualmente pela área admin; vazio quando o lead veio do formulário público |
| `possible_duplicate_of` | uuid | nullable, fk → `leads.id` — aponta para um lead já existente com o mesmo e-mail ou WhatsApp, calculado no momento da criação |
| `last_interaction_at` | timestamptz | nullable — data da última linha em `lead_interactions` para este lead; mantido por trigger (ver nota de implementação), evita recalcular isso a cada carregamento do painel |

### `lead_interactions`

Linha do tempo única por lead: mensagens enviadas, respostas recebidas, observações internas e mudanças de status, tudo com data/hora exata e autoria. Substitui o que antes seria uma tabela `lead_notes` separada — registrar "mensagem enviada" aqui já funciona como a confirmação/checklist de que o contato foi feito, sem precisar de uma estrutura própria só pra isso.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, pk | |
| `lead_id` | uuid, fk → `leads.id` (`on delete cascade`) | |
| `author_id` | uuid | nullable, fk → `admin_users.user_id` — vazio em `mensagem_recebida` (o cliente não tem conta no sistema) e em `mudanca_status` quando gerado automaticamente |
| `type` | text, not null | check `in ('nota', 'mensagem_enviada', 'mensagem_recebida', 'mudanca_status')` |
| `content` | text, not null | o que foi dito/observado; em `mudanca_status`, preenchido automaticamente (ex.: "Status alterado de Novo lead para Proposta enviada") |
| `occurred_at` | timestamptz, not null, default `now()` | dia e horário exatos do evento — pode ser retroativo, se o admin registrar depois de já ter mandado a mensagem |

### `lead_meetings`

Um lead pode ter mais de uma reunião ao longo da negociação (ligação inicial, apresentação de proposta, etc.), por isso é tabela própria em vez de um campo em `leads`.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, pk | |
| `lead_id` | uuid, fk → `leads.id` (`on delete cascade`) | |
| `scheduled_at` | timestamptz, not null | data e horário da reunião |
| `status` | text, not null | default `agendada`; check `in ('agendada', 'realizada', 'cancelada')` |
| `notes` | text | nullable |
| `created_at` | timestamptz, default `now()` | |

### Notas de implementação para Amelia (automações de banco)

- **Trigger de mudança de status**: `AFTER UPDATE ON leads WHEN (OLD.status IS DISTINCT FROM NEW.status)` insere automaticamente uma linha `mudanca_status` em `lead_interactions`. Fica no banco (não no código da aplicação) pra funcionar mesmo se o status for alterado por outro caminho no futuro.
- **Manutenção de `last_interaction_at`**: trigger `AFTER INSERT ON lead_interactions` atualiza `leads.last_interaction_at`. Evita agregar (`MAX`) a tabela de interações toda vez que o painel carrega.
- **Detecção de duplicidade**: no momento do insert (tanto pelo `POST /api/leads` público quanto pela criação manual em `/painel-8f2k/leads/novo`), buscar um lead existente com o mesmo `email` ou `whatsapp`; se encontrar, preencher `possible_duplicate_of` com o `id` mais antigo. Não bloqueia a criação — o visitante do site continua recebendo confirmação normal de envio — só fica marcado para o admin decidir se são a mesma pessoa.

### `cases`

Campos de conteúdo definidos diretamente pelo negócio (não pela Amelia): nome, print, link, descrição detalhada, stacks usadas, o que resolveu e por que o projeto foi construído.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, pk | |
| `slug` | text, unique, not null | usado na URL pública |
| `title` | text, not null | nome do projeto |
| `category` | text, not null | mesma taxonomia de `project_type` — usada só pra filtro/organização interna, não é um campo que o negócio pediu explicitamente |
| `client_name` | text | nullable |
| `is_founder_project` | boolean, not null, default `false` | identifica projetos anteriores à Vexiom, conforme a diretriz de transparência em [Estrutura e conteúdo](03-estrutura-e-conteudo.md) |
| `project_id` | uuid | nullable, fk → `projects.id`. Nem todo projeto vira case pública; quando vira, este é o vínculo. |
| `cover_image_url` | text | print do projeto — armazenado no Supabase Storage (bucket `case-images`) |
| `gallery_urls` | text[] | nullable — prints adicionais, além do principal |
| `external_link` | text | link do projeto |
| `description` | text, not null | descrição detalhada |
| `tech_stack` | text[] | nullable — stacks usadas, campo opcional |
| `problem_solved` | text, not null | o que o projeto resolveu |
| `motivation` | text, not null | motivo pelo qual o projeto foi construído |
| `published` | boolean, not null, default `false` | |
| `display_order` | int, not null, default `0` | ordenação manual na grade pública |
| `created_at` / `updated_at` | timestamptz | |

### `admin_users`

| Coluna | Tipo |
|---|---|
| `user_id` | uuid, pk, fk → `auth.users.id` (`on delete cascade`) |
| `role` | text, not null, check `in ('super_admin', 'employer')` |
| `name` | text | nullable, nome de exibição (usado no dropdown de `assigned_to` e nos lançamentos financeiros por sócio) |
| `created_at` | timestamptz, default `now()` |

### `projects` (interno, não público)

Representa qualquer trabalho contratado, esteja ele publicado como `case` ou não. Existe pra que o financeiro consiga rastrear lucro por projeto mesmo quando o projeto nunca vira destaque de portfólio.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, pk | |
| `title` | text, not null | |
| `client_name` | text | nullable |
| `lead_id` | uuid | nullable, fk → `leads.id` — quando o projeto se origina de um lead capturado pelo site |
| `status` | text, not null | default `em_andamento`; check `in ('em_andamento', 'concluido', 'cancelado')` |
| `started_at` / `finished_at` | date | nullable |
| `created_at` | timestamptz, default `now()` |

### `financial_transactions`

Livro-caixa único da Vexiom. Gasto e investimento não são categorias separadas: são o mesmo tipo de lançamento, diferenciados por **quem financiou** — quando `partner_id` está preenchido, aquele lançamento (entrada ou saída) foi bancado pessoalmente por um sócio; quando vazio, é um movimento normal do caixa da empresa.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid, pk | |
| `direction` | text, not null | check `in ('entrada', 'saida')` |
| `category` | text, not null | texto livre, com lista sugerida na UI (ex.: `receita_projeto`, `ferramentas_assinaturas`, `marketing`, `terceirizacao`, `impostos_taxas`, `equipamento`, `outro`). Sem `check` rígido no banco de propósito — permite adicionar categoria nova sem migration, já que só 2 pessoas lançam dados e o risco de inconsistência é baixo. |
| `amount` | numeric(12,2), not null | check `amount > 0` |
| `occurred_at` | date, not null | default `current_date` |
| `description` | text, not null | |
| `project_id` | uuid | nullable, fk → `projects.id` — vazio para lançamentos que não pertencem a um projeto específico (aporte de sócio, venda avulsa, despesa geral) |
| `partner_id` | uuid | nullable, fk → `admin_users.user_id` — preenchido = esse lançamento foi financiado pessoalmente por esse sócio (é o que a UI rotula como "investimento/aporte") |
| `created_by` | uuid, not null | fk → `admin_users.user_id` — quem registrou o lançamento |
| `created_at` | timestamptz, default `now()` |

## Segurança (RLS)

- `admin_users`: RLS habilitado; cada usuário só lê a própria linha (`auth.uid() = user_id`). É o suficiente para a aplicação descobrir o papel do usuário logado.
- `leads`:
  - **Sem policy de insert para `anon`.** A escrita pública acontece só via `POST /api/leads` (Route Handler), usando a *service role key* no servidor — nunca exposta ao navegador. O Zod valida o payload antes do insert. Isso evita ter que desenhar uma policy de insert anônimo "segura o suficiente" para não deixar o visitante forjar `status`, `assigned_to` etc.
  - `select`/`update`: liberado para `app_current_role() in ('super_admin', 'employer')`.
  - `delete`: só `app_current_role() = 'super_admin'`.
- `lead_interactions` e `lead_meetings`: mesma regra de `leads` para select/insert/update; delete só `super_admin` (opcional, baixa prioridade).
- `cases`:
  - `select`: `published = true` para todos (alimenta a página pública `/cases`), OU `published = true or app_current_role() = 'super_admin'` para o admin também enxergar rascunhos.
  - `insert`/`update`/`delete`: só `app_current_role() = 'super_admin'`.
- Storage bucket `case-images`: leitura pública; escrita restrita a usuários autenticados com `app_current_role() = 'super_admin'`.
- `projects` e `financial_transactions`: acesso total (`select`/`insert`/`update`/`delete`) restrito a `app_current_role() = 'super_admin'`. O `employer` não enxerga nada dessas tabelas — nem em modo leitura.

## Rotas da aplicação

- `/painel-8f2k/login` — público, login por e-mail/senha.
- `/painel-8f2k` — redireciona para `/painel-8f2k/leads`.
- `/painel-8f2k/leads` — painel de saúde da prospecção + lista com busca (nome/empresa/e-mail/WhatsApp) e filtros combináveis (status, tag, tipo de projeto, responsável); `super_admin` e `employer`.
- `/painel-8f2k/leads/novo` — cadastro manual de lead (indicação, evento, contato fora do site); `super_admin` e `employer`.
- `/painel-8f2k/leads/[id]` — timeline de interações (mensagens, notas e mudanças de status), reuniões, muda status, define próxima ação com data/horário, define probabilidade, tags e responsável. Mostra um aviso se `possible_duplicate_of` estiver preenchido.
- `/painel-8f2k/cases` — lista de cases (publicado/rascunho); só `super_admin`.
- `/painel-8f2k/cases/novo` e `/painel-8f2k/cases/[id]/editar` — formulário com upload de imagem para o Storage; só `super_admin`.
- `/painel-8f2k/financeiro` — dashboard financeiro; só `super_admin` (ver seção dedicada abaixo).
- `/painel-8f2k/financeiro/novo` — formulário de lançamento (entrada ou saída); só `super_admin`.

## Painel de saúde da prospecção (`/painel-8f2k/leads`)

Acessível por `super_admin` e `employer`. Fica no topo de `/painel-8f2k/leads`, acima da lista/tabela de leads, e mostra:

- **Funil por status** — contagem de leads agrupados por `status`, pra enxergar onde o pipeline está entupindo.
- **Alerta de SLA estourado** — destaca leads sem primeiro contato registrado (`viewed_at is null`) há mais de 12h úteis desde `created_at`, conforme o prazo definido em [Operação comercial](06-operacao-comercial-e-contato.md).
- **Leads sem próxima ação** — leads com `next_action is null` e `status` fora dos estados terminais (`contrato_fechado`, `nao_convertido`, `em_suporte_continuo`). Existe porque o doc 06 exige que "cada lead tenha uma próxima ação definida para evitar esquecimentos".
- **Follow-ups vencidos** — leads com `next_action_at` no passado e ainda sem resolução.
- **Taxa de conversão** — `count(status = 'contrato_fechado') / count(*)` no período selecionado.
- **Tipo de projeto mais pedido** — distribuição de leads por `project_type`.
- **Volume de leads ao longo do tempo** — contagem de leads por mês, para ver tendência de crescimento, estagnação ou queda.
- **Leads esfriando** — leads fora de status terminal com `last_interaction_at` há mais de 5 dias (valor inicial, fácil de ajustar depois — é só uma constante de consulta, não uma decisão de schema). Diferente do follow-up vencido: pega o lead que ninguém sequer marcou pra fazer follow-up e que simplesmente parou de andar.

### Alerta de follow-up marcado

Ao abrir `/painel-8f2k` (ou `/painel-8f2k/leads`), se houver algum lead com `next_action_at` ou `lead_meetings.scheduled_at` para o dia de hoje (incluindo atrasados), aparece um banner/modal bem chamativo listando esses leads com o horário marcado — impossível de não ver. É um destaque calculado no carregamento da página, não uma notificação push real: só dispara quando o admin abre o painel, não enquanto ele está fechado (ver "Fora de escopo").

### Nota de implementação para Amelia

- "12h úteis" precisa de uma função utilitária que exclua fins de semana ao calcular o prazo (feriados nacionais ficam fora do escopo da v1 — checagem só por dia da semana).
- Os gráficos deste painel seguem a mesma regra do dashboard financeiro: consultar a skill `dataviz` antes de escrever qualquer código de gráfico.

## Dashboard financeiro do `super_admin`

Área exclusiva do `super_admin` — o `employer` não tem acesso, nem em modo leitura. Centraliza todo o dinheiro que passa pela Vexiom: receita de projeto, despesa operacional e aporte pessoal de sócio, todos vindos da mesma tabela `financial_transactions`.

### O que o painel mostra

- **Saldo do período** (entrada − saída = lucro), com seletor de período (mês atual por padrão, com opção de mês/ano/intervalo customizado).
- **Entrada vs. saída ao longo do tempo** — gráfico de linha/área, por mês.
- **Gasto por categoria** — gráfico de barras ou pizza, usando o campo `category`.
- **Aporte por sócio** — gráfico de barras separando o total financiado por cada `partner_id`, deixando claro na UI que aquilo é dinheiro pessoal investido na empresa, não faturamento.
- **Lucro por projeto** (opcional, ao abrir um `project` específico) — soma das entradas menos soma das saídas vinculadas àquele `project_id`.

Todo lançamento com `partner_id` preenchido recebe um selo visual (ex.: "Aporte de [nome do sócio]") na listagem, pra nunca ficar ambíguo se aquele dinheiro veio do caixa da empresa ou do bolso de um sócio.

### Nota de implementação para Amelia

Antes de escrever qualquer código de gráfico, consultar a skill `dataviz` do projeto (paleta, acessibilidade, forma dos componentes) — não inventar estilo de gráfico do zero.

## Fluxo público afetado

- `/contato`: o `ContactForm` passa a ter todos os campos do doc 06 (nome, empresa, e-mail, WhatsApp, tipo de projeto, descrição, prazo desejado, faixa de investimento, melhor canal/horário), enviados via `POST /api/leads`. A tela informa claramente sucesso ou erro no envio.
- `/cases`: a página pública passa a buscar os registros `published = true` da tabela `cases` (leitura anônima via Supabase), substituindo o placeholder "Em breve".

## Fora de escopo desta fatia

- Notificações em tempo real (Supabase Realtime) e envio de e-mail/WhatsApp no horário exato do follow-up. V1 usa uma contagem simples de leads com `viewed_at is null` e um destaque calculado quando o admin abre o painel, não um aviso enquanto o painel está fechado.
- Tela de convite/cadastro de novos usuários administrativos.
- Reordenação de cases por drag-and-drop — usa `display_order` numérico definido manualmente.

## Variáveis de ambiente necessárias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — leitura pública de `cases`.
- `SUPABASE_SERVICE_ROLE_KEY` — usada apenas em código de servidor (Route Handlers), nunca enviada ao navegador.

## Ordem de implementação sugerida

1. Migration SQL: tabelas, `app_current_role()`, policies de RLS.
2. Clients Supabase em `src/lib/supabase/` (cliente anônimo para o browser/páginas públicas, cliente com service role para uso exclusivo em servidor).
3. `POST /api/leads` (validação Zod + insert) e atualização do `ContactForm`.
4. `middleware.ts` de autenticação + `/painel-8f2k/login`.
5. `/painel-8f2k/leads` (lista e detalhe).
6. `/cases` pública lendo do Supabase.
7. `/painel-8f2k/cases` (CRUD + upload de imagem no Storage).
8. `/painel-8f2k/financeiro` (dashboard + lançamentos), incluindo as tabelas `projects` e `financial_transactions`.

## Decisões registradas

| Data | Decisão | Responsável |
|---|---|---|
| 2026-09-23 | Acesso administrativo criado manualmente via SQL/painel do Supabase, sem tela pública de convite nesta fase. | scorpion |
| 2026-09-23 | `employer` tem acesso apenas ao módulo de leads. Cases e financeiro ficam restritos a `super_admin`. | scorpion |
| 2026-09-23 | Cases nascem dinâmicos via Supabase (com área admin de CRUD), em vez de estáticos no código. | scorpion |
| 2026-09-23 | Gasto e investimento não são categorias separadas: um único campo `partner_id` opcional em `financial_transactions` diferencia lançamento financiado por sócio (investimento) de despesa normal da empresa. | scorpion |
| 2026-09-23 | Criada tabela interna `projects`, separada de `cases`, para rastrear financeiro de qualquer trabalho contratado mesmo quando não vira portfólio público. | scorpion |
| 2026-09-23 | Campos de `cases` definidos pelo negócio: nome, print, link, descrição detalhada, stacks usadas (opcional), o que resolveu e motivo de ter sido construído. Substituem os campos summary/problem/solution/result inicialmente propostos. | scorpion |
| 2026-09-23 | `/painel-8f2k/leads` ganha painel de saúde da prospecção: funil por status, alerta de SLA estourado, leads sem próxima ação, follow-ups vencidos, taxa de conversão, tipo de projeto mais pedido e volume de leads ao longo do tempo. Carga por responsável e tempo médio até resposta/fechamento ficaram de fora por enquanto (pouco volume de dados / pouca gente pra distribuir carga). | scorpion |
| 2026-09-23 | Formulário de contato nasce completo, com todos os campos do doc 06, em vez de uma versão enxuta. | scorpion |
| 2026-09-23 | Leads têm campo de responsável (`assigned_to`) desde a v1, para evitar contato duplicado. | scorpion |
| 2026-09-23 | Escrita pública de leads passa por Route Handler com service role key, não por RLS de insert anônimo. | Amelia |
| 2026-09-23 | `lead_notes` vira `lead_interactions`: timeline única de mensagens enviadas/recebidas e notas, com data/hora exata. Registrar "mensagem enviada" já serve como confirmação, sem checklist separado. | scorpion |
| 2026-09-23 | Criada tabela `lead_meetings` para suportar mais de uma reunião por lead ao longo da negociação. | scorpion |
| 2026-09-23 | `leads` ganha `probability` (baixa/média/alta, não percentual), `tags` livres e `non_conversion_reason`. `next_action_date` vira `next_action_at` (data + horário). | scorpion |
| 2026-09-23 | Alerta de follow-up marcado é um destaque calculado ao abrir o admin (sem push real, sem e-mail/WhatsApp) — escopo menor, sem depender de infraestrutura de notificação em tempo real. | scorpion |
| 2026-09-24 | Adicionado cadastro manual de lead (`/painel-8f2k/leads/novo`) e campo `source`, pra cobrir leads que não vêm do formulário público (indicação, evento, etc.). | scorpion |
| 2026-09-24 | Adicionada detecção de duplicidade (`possible_duplicate_of`) na criação de lead, resolvendo a exigência já registrada em [Operação comercial](06-operacao-comercial-e-contato.md) de evitar duplicidade acidental. | scorpion |
| 2026-09-24 | Adicionados: alerta de "lead esfriando" (sem interação há 5+ dias, mantido via `last_interaction_at`), histórico automático de mudança de status via trigger, e busca/filtros combinados na lista de leads. | scorpion |
| 2026-09-24 | Rota administrativa usa o prefixo `/painel-8f2k` em vez de `/admin`, como camada extra contra quem tenta adivinhar a URL (a proteção real continua sendo autenticação + RLS). | scorpion |
