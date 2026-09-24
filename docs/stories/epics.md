---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["docs/plans/08-integracao-supabase-e-area-administrativa.md"]
---

# V_TECH_ (Vexiom) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Vexiom Supabase integration and administrative area, decomposing the requirements from `docs/plans/08-integracao-supabase-e-area-administrativa.md` into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: O sistema deve permitir login de administradores via Supabase Auth (e-mail + senha), sem tela pública de cadastro.
FR2: O sistema deve reconhecer dois papéis de acesso, `super_admin` e `employer`, definidos na tabela `admin_users`.
FR3: O sistema deve proteger todas as rotas sob `/painel-8f2k/*` via middleware, redirecionando usuários sem sessão para `/painel-8f2k/login` e usuários sem permissão de papel para `/painel-8f2k/leads`.
FR4: O visitante do site deve poder enviar um formulário de contato completo (nome, empresa, e-mail, WhatsApp, tipo de projeto, descrição, prazo desejado, faixa de investimento, melhor canal/horário) que grava um novo lead.
FR5: O sistema deve informar claramente ao visitante se o envio do formulário foi concluído com sucesso ou apresentou erro.
FR6: O sistema deve detectar, no momento da criação de um lead (via formulário público ou cadastro manual), se já existe outro lead com o mesmo e-mail ou WhatsApp, e marcar essa possível duplicidade sem bloquear a criação.
FR7: Um administrador deve poder cadastrar um lead manualmente pela área admin (`/painel-8f2k/leads/novo`), para leads que não vieram do formulário do site.
FR8: Um administrador deve poder visualizar a lista de leads com busca (nome/empresa/e-mail/WhatsApp) e filtros combináveis por status, tag, tipo de projeto e responsável.
FR9: Um administrador deve poder abrir o detalhe de um lead e ver sua timeline completa de interações (mensagens enviadas, mensagens recebidas, notas e mudanças de status), cada uma com data/hora exata e autoria.
FR10: Um administrador deve poder registrar uma mensagem enviada ou recebida, ou uma nota, na timeline de um lead.
FR11: Um administrador deve poder marcar um lead como visualizado (`viewed_at`) e como respondido (`responded_at`).
FR12: Um administrador deve poder alterar o status de um lead entre os status comerciais definidos (novo lead, em análise, primeiro contato realizado, conversa agendada, proposta em preparação, proposta enviada, follow-up pendente, contrato fechado, não convertido, em suporte contínuo).
FR13: O sistema deve registrar automaticamente na timeline do lead toda mudança de status, sem depender de ação manual do administrador.
FR14: Um administrador deve poder definir a próxima ação de um lead com data e horário (`next_action`, `next_action_at`).
FR15: Um administrador deve poder definir a probabilidade de fechamento de um lead como baixa, média ou alta.
FR16: Um administrador deve poder aplicar tags livres a um lead.
FR17: Um administrador deve poder registrar o motivo de não conversão quando um lead é marcado como `nao_convertido`.
FR18: Um administrador deve poder atribuir um lead a um responsável (`assigned_to`) dentre os usuários administrativos.
FR19: Um administrador deve poder agendar, marcar como realizada ou cancelar reuniões vinculadas a um lead, podendo haver mais de uma reunião por lead.
FR20: O sistema deve exibir, ao abrir o painel administrativo, um destaque bem visível listando os leads com follow-up (`next_action_at`) ou reunião (`lead_meetings.scheduled_at`) marcados para o dia atual ou em atraso, incluindo o horário.
FR21: O painel de leads deve exibir um funil com a contagem de leads por status.
FR22: O painel de leads deve destacar leads sem primeiro contato registrado há mais de 12 horas úteis desde a criação.
FR23: O painel de leads deve destacar leads sem próxima ação definida (fora dos status terminais).
FR24: O painel de leads deve destacar follow-ups vencidos (com `next_action_at` no passado).
FR25: O painel de leads deve destacar leads "esfriando": sem qualquer interação registrada há mais de um número configurável de dias, fora dos status terminais.
FR26: O painel de leads deve exibir a taxa de conversão (proporção de leads em status `contrato_fechado` sobre o total) no período selecionado.
FR27: O painel de leads deve exibir a distribuição de leads por tipo de projeto.
FR28: O painel de leads deve exibir o volume de leads recebidos ao longo do tempo (por mês).
FR29: Um `super_admin` deve poder cadastrar, editar, publicar/despublicar e reordenar manualmente cases de portfólio, incluindo nome, print (imagem), link, descrição detalhada, stacks usadas (opcional), o que o projeto resolveu e o motivo de ele ter sido construído.
FR30: Um case deve poder ser marcado como projeto anterior à Vexiom (`is_founder_project`), exibindo essa informação com transparência.
FR31: Um case deve poder, opcionalmente, ser vinculado a um projeto interno (`project_id`).
FR32: A página pública `/cases` deve exibir somente os cases marcados como publicados, buscando os dados do Supabase.
FR33: Um `super_admin` deve poder fazer upload de imagens de um case para o Supabase Storage.
FR34: Um `super_admin` deve poder cadastrar projetos internos (`projects`), representando qualquer trabalho contratado, esteja ele publicado como case ou não.
FR35: Um `super_admin` deve poder registrar lançamentos financeiros (entrada ou saída), com categoria, valor, data, descrição, projeto vinculado (opcional) e sócio financiador (opcional).
FR36: O sistema deve identificar visualmente, no dashboard financeiro, todo lançamento financiado por um sócio como um aporte/investimento pessoal, distinto de um lançamento normal da empresa.
FR37: O dashboard financeiro deve exibir o saldo do período (entrada menos saída) com seletor de período (mês atual por padrão, com opção de intervalo customizado).
FR38: O dashboard financeiro deve exibir um gráfico de entrada vs. saída ao longo do tempo.
FR39: O dashboard financeiro deve exibir um gráfico de gastos por categoria.
FR40: O dashboard financeiro deve exibir um gráfico de aporte por sócio.
FR41: O dashboard financeiro deve exibir o lucro de um projeto específico (soma de entradas menos saídas vinculadas a ele).

### NonFunctional Requirements

NFR1: Toda rota administrativa (`/painel-8f2k/*`) deve exigir sessão autenticada válida via Supabase Auth.
NFR2: O papel `employer` não deve ter acesso, nem em modo leitura, aos dados de `cases`, `projects` e `financial_transactions`.
NFR3: A escrita pública de leads não deve depender de política de RLS de insert anônimo; deve ocorrer via Route Handler de servidor usando a service role key, nunca exposta ao navegador.
NFR4: Todo payload recebido do formulário público deve ser validado com Zod antes de qualquer gravação no banco.
NFR5: As políticas de RLS de `admin_users`, `leads`, `lead_interactions`, `lead_meetings`, `cases`, `projects` e `financial_transactions` devem ser aplicadas via função `current_role()` (`SECURITY DEFINER`), evitando recursão de RLS.
NFR6: O bucket de imagens de cases no Supabase Storage deve permitir leitura pública, mas restringir escrita a usuários autenticados com papel `super_admin`.
NFR7: O cálculo de "lead esfriando" e do painel de saúde da prospecção não deve exigir agregações custosas (`MAX`) sobre a tabela de interações a cada carregamento — o campo `last_interaction_at` deve ser mantido via trigger de banco.
NFR8: Antes de implementar qualquer gráfico (painel de leads ou dashboard financeiro), a skill `dataviz` do projeto deve ser consultada para paleta, acessibilidade e forma dos componentes.
NFR9: A checagem de "12h úteis" deve excluir fins de semana (feriados nacionais ficam fora do escopo desta fatia).

### Additional Requirements

- Variáveis de ambiente necessárias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (uso exclusivo em código de servidor).
- Trigger de banco (`AFTER UPDATE ON leads`) para inserir automaticamente uma entrada `mudanca_status` em `lead_interactions` quando `leads.status` mudar.
- Trigger de banco (`AFTER INSERT ON lead_interactions`) para manter `leads.last_interaction_at` atualizado.
- Detecção de duplicidade de lead roda no momento do insert (formulário público e cadastro manual), preenchendo `possible_duplicate_of` sem bloquear a criação.
- Nenhuma tela pública de convite/cadastro de novos usuários administrativos nesta fase — contas criadas manualmente via SQL/painel do Supabase.
- Sem notificações em tempo real (Supabase Realtime) nem envio de e-mail/WhatsApp no horário do follow-up — apenas destaque calculado ao carregar o painel administrativo.
- Sem reordenação de cases por drag-and-drop — usa campo numérico `display_order` definido manualmente.
- Não há starter template envolvido — a aplicação Next.js já existe; esta é uma extensão do projeto atual, não um projeto greenfield.
- Ordem de implementação sugerida no documento de origem (referência para o sequenciamento dos épicos): (1) migrations + RLS, (2) clients Supabase, (3) API de leads + formulário público, (4) middleware de auth + login, (5) `/painel-8f2k/leads`, (6) `/cases` pública, (7) `/painel-8f2k/cases`, (8) `/painel-8f2k/financeiro`.

### UX Design Requirements

Não aplicável — nenhum documento de UX design dedicado foi produzido para esta fatia. Os padrões visuais já estabelecidos no restante do site (grafite escuro + amarelo `#FBD020`, cards com borda `#292b28`, componentes já usados em `/servicos` e `/como-trabalhamos`) servem de referência de continuidade visual, e a skill `dataviz` do projeto deve orientar a construção de qualquer gráfico (NFR8).

### FR Coverage Map

FR1: Epic 1 - Login via Supabase Auth
FR2: Epic 1 - Papéis super_admin/employer
FR3: Epic 1 - Proteção de rotas via middleware
FR4: Epic 2 - Formulário público de contato completo
FR5: Epic 2 - Feedback de sucesso/erro no envio
FR6: Epic 2 - Detecção de duplicidade
FR7: Epic 2 - Cadastro manual de lead
FR8: Epic 2 - Busca e filtros na lista de leads
FR9: Epic 2 - Timeline de interações do lead
FR10: Epic 2 - Registro de mensagem/nota na timeline
FR11: Epic 2 - Marcar visualizado/respondido
FR12: Epic 2 - Alterar status do lead
FR13: Epic 2 - Log automático de mudança de status
FR14: Epic 2 - Próxima ação com data/horário
FR15: Epic 2 - Probabilidade do lead
FR16: Epic 2 - Tags livres
FR17: Epic 2 - Motivo de não conversão
FR18: Epic 2 - Atribuição de responsável
FR19: Epic 2 - Reuniões do lead
FR20: Epic 3 - Alerta de follow-up/reunião do dia
FR21: Epic 3 - Funil por status
FR22: Epic 3 - Alerta de SLA estourado
FR23: Epic 3 - Leads sem próxima ação
FR24: Epic 3 - Follow-ups vencidos
FR25: Epic 3 - Leads esfriando
FR26: Epic 3 - Taxa de conversão
FR27: Epic 3 - Tipo de projeto mais pedido
FR28: Epic 3 - Volume de leads ao longo do tempo
FR29: Epic 4 - CRUD de cases
FR30: Epic 4 - Flag de projeto anterior à Vexiom
FR31: Epic 5 - Vínculo opcional case-projeto (implementado no lado do projeto, já que `projects` só existe a partir do Epic 5)
FR32: Epic 4 - Página pública /cases
FR33: Epic 4 - Upload de imagem de case
FR34: Epic 5 - Cadastro de projetos internos
FR35: Epic 5 - Lançamentos financeiros
FR36: Epic 5 - Identificação visual de aporte de sócio
FR37: Epic 5 - Saldo do período
FR38: Epic 5 - Gráfico entrada vs. saída
FR39: Epic 5 - Gráfico de gasto por categoria
FR40: Epic 5 - Gráfico de aporte por sócio
FR41: Epic 5 - Lucro por projeto

## Epic List

### Epic 1: Autenticação e Acesso Administrativo
Administradores conseguem logar via Supabase Auth e o sistema reconhece os dois papéis (`super_admin`/`employer`), protegendo toda rota `/painel-8f2k/*` conforme a permissão de cada um. A rota administrativa usa o prefixo não óbvio `/painel-8f2k` em vez de `/admin`.
**FRs cobertas:** FR1, FR2, FR3

### Epic 2: Captação e Gestão de Leads
Do visitante enviando o formulário até o time gerenciando o ciclo de vida completo do lead: captura pública, detecção de duplicidade, cadastro manual, timeline de interações, status com histórico automático, próxima ação, probabilidade, tags, motivo de não conversão, responsável e reuniões.
**FRs cobertas:** FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Epic 3: Painel de Saúde da Prospecção
Visão consolidada sobre o funil: contagem por status, alerta de SLA estourado, leads sem próxima ação, follow-ups vencidos, leads esfriando, taxa de conversão, tipo de projeto mais pedido, volume ao longo do tempo, e o alerta chamativo de follow-up/reunião do dia.
**FRs cobertas:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28

### Epic 4: Portfólio de Cases
`super_admin` cadastra, edita, publica e organiza cases (nome, print, link, descrição, stacks, o que resolveu, motivação), com upload de imagem; a página pública `/cases` passa a exibir os publicados.
**FRs cobertas:** FR29, FR30, FR32, FR33

### Epic 5: Projetos Internos e Financeiro
`super_admin` cadastra projetos internos (ligados ou não a um lead/case) e lançamentos financeiros (entrada/saída, categoria, sócio financiador), com o dashboard financeiro completo (saldo, gráficos, lucro por projeto).
**FRs cobertas:** FR31, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41

## Epic 1: Autenticação e Acesso Administrativo

Administradores conseguem logar via Supabase Auth e o sistema reconhece os dois papéis (`super_admin`/`employer`), protegendo toda rota `/painel-8f2k/*` conforme a permissão de cada um.

### Story 1.1: Login administrativo com reconhecimento de papel

As an administrador (`super_admin` ou `employer`),
I want fazer login com e-mail e senha em `/painel-8f2k/login` e ter meu papel reconhecido pelo sistema,
So that eu acesso a área administrativa com as permissões corretas pro meu papel.

**Acceptance Criteria:**

**Given** um usuário existe no Supabase Auth e tem uma linha correspondente em `admin_users`
**When** ele submete e-mail e senha válidos em `/painel-8f2k/login`
**Then** uma sessão é criada, o papel (`super_admin` ou `employer`) é lido de `admin_users`, e o usuário é redirecionado para `/painel-8f2k/leads`

**Given** credenciais inválidas
**When** o formulário de login é submetido
**Then** uma mensagem de erro é exibida e nenhuma sessão é criada

**Given** um usuário autenticado no Supabase Auth sem linha correspondente em `admin_users`
**When** ele tenta acessar qualquer rota de `/painel-8f2k`
**Then** o acesso é negado (tratado como sem papel/não autorizado), mesmo com sessão válida no Supabase Auth

### Story 1.2: Proteção de rotas administrativas por sessão e papel

As the sistema,
I want proteger toda rota sob `/painel-8f2k/*` via middleware, verificando sessão e papel,
So that ninguém sem autenticação ou sem permissão acessa uma tela administrativa.

**Acceptance Criteria:**

**Given** nenhuma sessão válida
**When** uma requisição chega em qualquer rota `/painel-8f2k/*` (exceto `/painel-8f2k/login`)
**Then** o usuário é redirecionado para `/painel-8f2k/login`

**Given** uma sessão válida com papel `employer`
**When** o usuário tenta acessar uma rota restrita a `super_admin` (ex.: `/painel-8f2k/cases`, `/painel-8f2k/financeiro`)
**Then** ele é redirecionado para `/painel-8f2k/leads`

**Given** uma sessão válida com papel `super_admin`
**When** o usuário acessa qualquer rota sob `/painel-8f2k/*`
**Then** o acesso é concedido

## Epic 2: Captação e Gestão de Leads

Do visitante enviando o formulário até o time gerenciando o ciclo de vida completo do lead: captura pública, detecção de duplicidade, cadastro manual, timeline de interações, status com histórico automático, próxima ação, probabilidade, tags, motivo de não conversão, responsável e reuniões.

### Story 2.1: Envio de lead pelo formulário público

As a visitante do site,
I want preencher e enviar o formulário de contato completo (nome, empresa, e-mail, WhatsApp, tipo de projeto, descrição, prazo desejado, faixa de investimento, melhor canal/horário),
So that a Vexiom receba meu pedido de contato e eu saiba que foi recebido.

**Acceptance Criteria:**

**Given** o visitante preenche todos os campos obrigatórios do formulário (nome, e-mail, WhatsApp, tipo de projeto, descrição)
**When** ele envia o formulário
**Then** um novo registro é criado na tabela `leads` com status `novo_lead` e origem (`source`) `site`, e uma mensagem de sucesso é exibida na tela

**Given** o visitante deixa um campo obrigatório em branco
**When** ele tenta enviar o formulário
**Then** o envio é bloqueado no cliente com uma mensagem indicando o campo pendente, e nenhum lead é criado

**Given** ocorre uma falha ao gravar o lead (ex.: erro do Supabase)
**When** o formulário é submetido
**Then** uma mensagem de erro clara é exibida ao visitante, sem indicar que o lead foi criado

**Given** os campos opcionais (empresa, prazo desejado, faixa de investimento, melhor canal/horário) são deixados em branco
**When** o formulário é enviado
**Then** o lead é criado normalmente com esses campos nulos

### Story 2.2: Detecção de duplicidade na criação de lead

As the sistema,
I want verificar, ao criar um lead, se já existe outro lead com o mesmo e-mail ou WhatsApp,
So that o time perceba possíveis duplicatas sem perder o novo contato.

**Acceptance Criteria:**

**Given** já existe um lead com o mesmo e-mail cadastrado anteriormente
**When** um novo lead é criado com esse mesmo e-mail
**Then** o novo lead é criado normalmente e seu campo `possible_duplicate_of` é preenchido com o `id` do lead mais antigo encontrado

**Given** já existe um lead com o mesmo WhatsApp (mas e-mail diferente)
**When** um novo lead é criado
**Then** a mesma lógica de detecção se aplica considerando o WhatsApp

**Given** não existe nenhum lead com o mesmo e-mail ou WhatsApp
**When** um novo lead é criado
**Then** `possible_duplicate_of` permanece nulo

**Given** um lead tem `possible_duplicate_of` preenchido
**When** um administrador abre esse lead em `/painel-8f2k/leads/[id]`
**Then** um aviso visível indica a possível duplicidade, com link para o lead original

### Story 2.3: Cadastro manual de lead pelo admin

As an administrador,
I want cadastrar um lead manualmente em `/painel-8f2k/leads/novo`,
So that eu registre contatos que não vieram pelo formulário do site (indicação, evento, etc.).

**Acceptance Criteria:**

**Given** um administrador autenticado acessa `/painel-8f2k/leads/novo`
**When** ele preenche os campos obrigatórios (nome, e-mail, WhatsApp, tipo de projeto, descrição) e a origem (`source`, ex.: indicação, evento, Instagram)
**Then** um novo lead é criado com `created_by` apontando pra esse administrador, e a detecção de duplicidade (Story 2.2) é aplicada

**Given** o administrador tenta salvar sem preencher um campo obrigatório
**When** ele submete o formulário
**Then** o envio é bloqueado com uma indicação clara do campo pendente

**Given** o lead é criado manualmente
**When** ele aparece na listagem de leads
**Then** sua origem (`source`) é exibida, deixando claro que não veio do site

### Story 2.4: Listagem de leads com busca e filtros

As an administrador,
I want buscar e filtrar a lista de leads por nome/empresa/e-mail/WhatsApp, status, tag, tipo de projeto e responsável,
So that eu encontre rapidamente o lead que preciso, mesmo com muitos cadastrados.

**Acceptance Criteria:**

**Given** existem múltiplos leads cadastrados
**When** o administrador digita um termo no campo de busca (nome, empresa, e-mail ou WhatsApp)
**Then** a lista é filtrada para mostrar somente leads que correspondem ao termo

**Given** o administrador seleciona um ou mais filtros (status, tag, tipo de projeto, responsável)
**When** os filtros são aplicados
**Then** somente leads que atendem a todos os filtros selecionados são exibidos

**Given** busca e filtros são combinados
**When** aplicados juntos
**Then** o resultado reflete a interseção de todos os critérios

**Given** nenhum lead corresponde aos critérios
**When** a busca/filtro é aplicada
**Then** uma mensagem de "nenhum lead encontrado" é exibida, sem erro

### Story 2.5: Timeline de interações do lead: mensagens e notas

As an administrador,
I want registrar e visualizar mensagens enviadas, mensagens recebidas e notas na timeline de um lead, cada uma com data/hora exata,
So that eu tenha o histórico completo de contato com aquele lead, incluindo o que ele respondeu.

**Acceptance Criteria:**

**Given** um administrador está no detalhe de um lead (`/painel-8f2k/leads/[id]`)
**When** ele registra uma entrada do tipo "mensagem enviada", "mensagem recebida" ou "nota", com conteúdo e data/hora (padrão: agora, editável para retroativo)
**Then** a entrada é salva em `lead_interactions` vinculada a esse lead e ao autor (quando aplicável)

**Given** um lead tem múltiplas interações registradas
**When** o administrador abre o detalhe do lead
**Then** a timeline exibe todas as interações em ordem cronológica, com tipo, autor, data/hora e conteúdo

**Given** uma interação é do tipo "mensagem recebida"
**When** exibida na timeline
**Then** não é atribuída a nenhum administrador como autor (o cliente não tem conta no sistema)

### Story 2.6: Marcar lead como visualizado e respondido

As an administrador,
I want marcar um lead como visualizado e como respondido,
So that o time saiba rapidamente quais leads ainda não tiveram nenhum retorno.

**Acceptance Criteria:**

**Given** um lead ainda não foi aberto por nenhum administrador
**When** um administrador abre o detalhe do lead pela primeira vez
**Then** `viewed_at` é preenchido automaticamente com a data/hora atual

**Given** um lead já foi visualizado
**When** ele é aberto novamente
**Then** `viewed_at` não é sobrescrito (mantém o primeiro registro)

**Given** um administrador respondeu ao lead
**When** ele marca manualmente "respondido"
**Then** `responded_at` é preenchido com a data/hora atual

### Story 2.7: Alterar status do lead com histórico automático

As an administrador,
I want alterar o status de um lead entre os status comerciais definidos,
So that o funil reflita em que etapa da negociação cada lead está.

**Acceptance Criteria:**

**Given** um lead está em um status válido
**When** um administrador seleciona um novo status dentre os definidos (novo lead, em análise, primeiro contato realizado, conversa agendada, proposta em preparação, proposta enviada, follow-up pendente, contrato fechado, não convertido, em suporte contínuo)
**Then** o status do lead é atualizado

**Given** o status de um lead muda
**When** a alteração é salva
**Then** uma entrada do tipo `mudanca_status` é automaticamente adicionada à timeline (`lead_interactions`), via trigger de banco, sem ação manual do administrador, descrevendo o status anterior e o novo

**Given** um administrador tenta selecionar um valor de status fora da lista definida
**When** ele submete
**Then** a alteração é rejeitada (validação de enum)

### Story 2.8: Qualificar e organizar o lead

As an administrador,
I want definir a próxima ação com data e horário, a probabilidade de fechamento, tags livres, o motivo de não conversão (quando aplicável) e o responsável pelo lead,
So that eu organize minha rotina de acompanhamento e priorize os leads certos.

**Acceptance Criteria:**

**Given** um administrador está no detalhe de um lead
**When** ele define uma próxima ação (texto) com data e horário (`next_action_at`)
**Then** esses valores são salvos em `next_action` e `next_action_at`, disponíveis para uso futuro por qualquer painel ou alerta que precise deles

**Given** um administrador está no detalhe de um lead
**When** ele seleciona a probabilidade (baixa, média ou alta)
**Then** o valor é salvo em `probability`

**Given** um administrador está no detalhe de um lead
**When** ele adiciona uma ou mais tags livres
**Then** elas são salvas em `tags` e exibidas na listagem e no detalhe do lead

**Given** um lead é marcado com status `nao_convertido`
**When** o administrador salva essa mudança
**Then** um campo de motivo de não conversão fica disponível para preenchimento e é salvo em `non_conversion_reason`

**Given** um administrador está no detalhe de um lead
**When** ele seleciona um responsável dentre os usuários administrativos cadastrados
**Then** o lead passa a exibir esse responsável (`assigned_to`) na listagem e no detalhe

### Story 2.9: Agendar e gerenciar reuniões do lead

As an administrador,
I want agendar uma ou mais reuniões vinculadas a um lead, e marcá-las como realizadas ou canceladas,
So that eu tenha controle de todos os encontros ao longo da negociação, não só o próximo.

**Acceptance Criteria:**

**Given** um administrador está no detalhe de um lead
**When** ele agenda uma reunião com data e horário
**Then** uma nova linha é criada em `lead_meetings` com status `agendada`, vinculada ao lead

**Given** uma reunião agendada já ocorreu
**When** o administrador a marca como "realizada"
**Then** o status da reunião é atualizado, mantendo o registro histórico

**Given** uma reunião agendada não vai mais acontecer
**When** o administrador a marca como "cancelada"
**Then** o status é atualizado para `cancelada`, e reuniões nesse status não devem ser tratadas como pendentes por nenhuma outra funcionalidade

**Given** um lead tem múltiplas reuniões ao longo do tempo
**When** o administrador abre o detalhe do lead
**Then** todas as reuniões (passadas e futuras) são listadas com data, horário e status

## Epic 3: Painel de Saúde da Prospecção

Visão consolidada sobre o funil: contagem por status, alerta de SLA estourado, leads sem próxima ação, follow-ups vencidos, leads esfriando, taxa de conversão, tipo de projeto mais pedido, volume ao longo do tempo, e o alerta chamativo de follow-up/reunião do dia.

### Story 3.1: Indicadores gerais da prospecção

As an administrador,
I want ver, no topo de `/painel-8f2k/leads`, o funil por status, a taxa de conversão, a distribuição por tipo de projeto e o volume de leads ao longo do tempo,
So that eu entenda rapidamente a saúde geral do funil de vendas.

**Acceptance Criteria:**

**Given** existem leads em diferentes status
**When** o administrador abre `/painel-8f2k/leads`
**Then** o painel exibe a contagem de leads agrupados por status (funil)

**Given** existem leads com diferentes desfechos
**When** o painel é carregado
**Then** a taxa de conversão (`contrato_fechado` / total) é exibida para o período selecionado

**Given** existem leads de diferentes tipos de projeto
**When** o painel é carregado
**Then** a distribuição de leads por `project_type` é exibida

**Given** existem leads criados em diferentes meses
**When** o painel é carregado
**Then** o volume de leads por mês é exibido, permitindo ver tendência de crescimento, estagnação ou queda

**Given** o administrador seleciona um período diferente do padrão
**When** o filtro de período é aplicado
**Then** os indicadores acima recalculam para refletir apenas o período selecionado

### Story 3.2: Alertas de risco na prospecção

As an administrador,
I want ver destacados os leads com SLA de primeiro contato estourado, sem próxima ação definida, com follow-up vencido, ou esfriando por falta de interação,
So that nenhum lead seja esquecido silenciosamente.

**Acceptance Criteria:**

**Given** um lead foi criado há mais de 12 horas úteis e ainda não tem `viewed_at` preenchido
**When** o painel é carregado
**Then** esse lead aparece destacado na lista de "SLA estourado"

**Given** um lead está fora de um status terminal (`contrato_fechado`, `nao_convertido`, `em_suporte_continuo`) e não tem `next_action` definido
**When** o painel é carregado
**Then** esse lead aparece destacado na lista de "sem próxima ação"

**Given** um lead tem `next_action_at` no passado e o status ainda não avançou
**When** o painel é carregado
**Then** esse lead aparece destacado na lista de "follow-ups vencidos"

**Given** um lead está fora de status terminal e `last_interaction_at` é nulo ou tem mais de 5 dias
**When** o painel é carregado
**Then** esse lead aparece destacado na lista de "leads esfriando"

**Given** um lead está em status terminal
**When** qualquer um dos cálculos acima é executado
**Then** esse lead nunca aparece em nenhuma das listas de alerta

### Story 3.3: Alerta de follow-up e reunião do dia

As an administrador,
I want ver um destaque bem visível, ao abrir o painel administrativo, com os leads que têm follow-up ou reunião marcados para hoje (incluindo atrasados) e seus horários,
So that eu nunca perca um compromisso do dia por não ter olhado a lista manualmente.

**Acceptance Criteria:**

**Given** existe um lead com `next_action_at` para o dia de hoje (ou uma data passada não resolvida)
**When** um administrador abre `/painel-8f2k` ou `/painel-8f2k/leads`
**Then** um banner/modal chamativo lista esse lead com o horário marcado

**Given** existe uma reunião (`lead_meetings.scheduled_at`) com status `agendada` para o dia de hoje ou atrasada
**When** o painel é carregado
**Then** essa reunião também aparece no mesmo destaque, com o horário

**Given** não existe nenhum follow-up ou reunião para hoje ou atrasado
**When** o painel é carregado
**Then** o destaque não é exibido

**Given** uma reunião foi cancelada
**When** calculado o destaque
**Then** reuniões canceladas nunca aparecem no alerta

## Epic 4: Portfólio de Cases

`super_admin` cadastra, edita, publica e organiza cases (nome, print, link, descrição, stacks, o que resolveu, motivação), com upload de imagem; a página pública `/cases` passa a exibir os publicados.

### Story 4.1: CRUD de cases no admin

As a super_admin,
I want cadastrar, editar, publicar/despublicar e ordenar manualmente cases de portfólio (nome, descrição detalhada, link, stacks usadas, o que resolveu, motivação, e se é projeto anterior à Vexiom),
So that eu controle o que aparece na página pública de portfólio e em que ordem.

**Acceptance Criteria:**

**Given** um super_admin acessa `/painel-8f2k/cases/novo`
**When** ele preenche os campos obrigatórios (nome, descrição detalhada, o que resolveu, motivação) e salva
**Then** um novo case é criado com `published = false` por padrão

**Given** um case existente
**When** o super_admin edita qualquer campo, incluindo marcar `is_founder_project`
**Then** as alterações são salvas

**Given** um case está em rascunho
**When** o super_admin marca "publicar"
**Then** `published` passa a `true` e o case passa a ser elegível pra aparecer na página pública

**Given** múltiplos cases publicados
**When** o super_admin ajusta a ordem manualmente (`display_order`)
**Then** a ordem exibida na página pública reflete esse valor

**Given** um usuário `employer` tenta acessar `/painel-8f2k/cases`
**When** a rota é carregada
**Then** o acesso é negado (redirecionado conforme Story 1.2)

### Story 4.2: Upload de imagens do case

As a super_admin,
I want fazer upload de uma imagem de capa (print do projeto) e imagens adicionais de galeria para um case,
So that o portfólio tenha uma apresentação visual real de cada projeto.

**Acceptance Criteria:**

**Given** um super_admin está editando um case
**When** ele faz upload de uma imagem de capa
**Then** a imagem é enviada ao bucket `case-images` do Supabase Storage e sua URL pública é salva em `cover_image_url`

**Given** um super_admin faz upload de imagens adicionais
**When** o upload é concluído
**Then** as URLs são adicionadas a `gallery_urls`

**Given** um usuário sem papel `super_admin` (autenticado ou anônimo)
**When** tenta fazer upload diretamente pro bucket `case-images`
**Then** a operação é rejeitada pela policy de Storage

### Story 4.3: Página pública de cases

As a visitante do site,
I want ver, em `/cases`, os projetos publicados pela Vexiom com suas informações e imagens,
So that eu entenda a qualidade e o tipo de trabalho que a Vexiom entrega antes de entrar em contato.

**Acceptance Criteria:**

**Given** existem cases com `published = true`
**When** um visitante acessa `/cases`
**Then** esses cases são exibidos, ordenados por `display_order`

**Given** existem cases com `published = false`
**When** a página pública é carregada
**Then** esses cases não aparecem para o visitante

**Given** um case tem `is_founder_project = true`
**When** exibido na página pública ou no detalhe
**Then** uma indicação clara de que é um projeto anterior à Vexiom é mostrada, conforme a diretriz de transparência do doc 03

## Epic 5: Projetos Internos e Financeiro

`super_admin` cadastra projetos internos (ligados ou não a um lead/case) e lançamentos financeiros (entrada/saída, categoria, sócio financiador), com o dashboard financeiro completo (saldo, gráficos, lucro por projeto).

### Story 5.1: Cadastro de projetos internos

As a super_admin,
I want cadastrar um projeto interno (título, cliente, status, datas, vínculo opcional com um lead),
So that eu rastreie qualquer trabalho contratado, publicado como case ou não.

**Acceptance Criteria:**

**Given** um super_admin acessa a área de projetos
**When** ele cadastra um novo projeto com título e status inicial `em_andamento`
**Then** o projeto é criado, opcionalmente vinculado a um `lead_id`

**Given** um projeto está em andamento
**When** o super_admin atualiza seu status para `concluido` ou `cancelado`
**Then** o status é atualizado, com `finished_at` preenchido quando concluído

**Given** um usuário `employer`
**When** tenta acessar a área de projetos internos
**Then** o acesso é negado

**Given** um projeto interno e um case publicado que representam o mesmo trabalho
**When** o super_admin vincula o projeto a esse case (`cases.project_id`)
**Then** o vínculo é salvo em `cases.project_id`, permitindo relacionar os dados financeiros desse projeto ao case correspondente

### Story 5.2: Registro de lançamentos financeiros

As a super_admin,
I want registrar lançamentos financeiros de entrada ou saída, com categoria, valor, data, descrição, projeto vinculado (opcional) e sócio financiador (opcional),
So that todo dinheiro que passa pela Vexiom fique registrado num único livro-caixa.

**Acceptance Criteria:**

**Given** um super_admin acessa `/painel-8f2k/financeiro/novo`
**When** ele preenche direção (entrada/saída), categoria, valor, data e descrição, e salva
**Then** um novo lançamento é criado em `financial_transactions`

**Given** o lançamento está vinculado a um projeto
**When** o super_admin seleciona um `project_id`
**Then** o lançamento é salvo com esse `project_id`, disponível para qualquer cálculo futuro de lucro por projeto

**Given** o lançamento foi financiado pessoalmente por um sócio
**When** o super_admin preenche `partner_id`
**Then** esse lançamento é identificado visualmente na listagem como um aporte/investimento pessoal daquele sócio, distinto de um lançamento normal da empresa

**Given** o campo `partner_id` é deixado vazio
**When** o lançamento é salvo
**Then** ele é tratado como um movimento normal do caixa da empresa, sem selo de aporte

### Story 5.3: Saldo financeiro do período

As a super_admin,
I want ver o saldo (entrada menos saída) do período selecionado no dashboard financeiro,
So that eu saiba rapidamente se a Vexiom está tendo lucro ou prejuízo naquele período.

**Acceptance Criteria:**

**Given** existem lançamentos de entrada e saída no mês atual
**When** o super_admin abre `/painel-8f2k/financeiro`
**Then** o saldo do mês atual (entrada menos saída) é exibido por padrão

**Given** o super_admin seleciona um período diferente (outro mês, ano, ou intervalo customizado)
**When** o filtro é aplicado
**Then** o saldo exibido é recalculado para refletir apenas o período selecionado

### Story 5.4: Gráficos do dashboard financeiro

As a super_admin,
I want ver gráficos de entrada vs. saída ao longo do tempo, gasto por categoria e aporte por sócio,
So that eu entenda visualmente para onde o dinheiro está indo e de onde está vindo.

**Acceptance Criteria:**

**Given** existem lançamentos financeiros ao longo de vários meses
**When** o dashboard financeiro é carregado
**Then** um gráfico de linha/área mostra entrada vs. saída por mês, seguindo a skill `dataviz` do projeto (NFR8)

**Given** existem lançamentos de saída em diferentes categorias
**When** o dashboard é carregado
**Then** um gráfico mostra o total de saída agrupado por `category`

**Given** existem lançamentos com `partner_id` preenchido para mais de um sócio
**When** o dashboard é carregado
**Then** um gráfico mostra o total financiado por cada sócio, separadamente

### Story 5.5: Lucro por projeto

As a super_admin,
I want ver o lucro de um projeto específico (entradas menos saídas vinculadas a ele),
So that eu saiba quais projetos realmente valeram a pena financeiramente.

**Acceptance Criteria:**

**Given** um projeto tem lançamentos de entrada e saída vinculados (`project_id`)
**When** o super_admin abre o detalhe desse projeto
**Then** o lucro (soma de entradas menos soma de saídas daquele projeto) é exibido

**Given** um projeto não tem nenhum lançamento vinculado
**When** o super_admin abre seu detalhe
**Then** o lucro é exibido como zero, sem erro
