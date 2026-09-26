-- Dados de exemplo para validar o fluxo completo de Cases.
--
-- Execute com privilégios de banco (ou pelo SQL Editor do Supabase) depois
-- das migrations. O seed é idempotente: executar novamente atualiza os
-- mesmos slugs em vez de criar duplicatas.
--
-- As imagens ficam nulas de propósito. A UI mostra o placeholder Vexiom até
-- que arquivos sejam enviados pela tela /painel-8f2k/cases/:id/editar.

begin;

insert into public.cases (
  slug,
  title,
  category,
  client_name,
  is_founder_project,
  project_id,
  cover_image_url,
  gallery_urls,
  external_link,
  description,
  tech_stack,
  problem_solved,
  motivation,
  published,
  display_order
)
values
  (
    'gestao-de-leads-sob-medida',
    'Gestão de leads sob medida',
    'Sistema sob medida',
    'Vexiom',
    true,
    null,
    null,
    array[]::text[],
    'https://vexiom.com.br',
    'A equipe precisava transformar contatos dispersos em uma rotina comercial clara, com contexto suficiente para saber quem abordar e qual deveria ser o próximo passo.',
    array['Next.js', 'TypeScript', 'Supabase']::text[],
    'Estruturamos um painel de leads com filtros, etapas comerciais, histórico de interações, alertas de risco e acompanhamento de próximas ações.',
    'O time passou a enxergar a carteira inteira em poucos minutos e ganhou uma rotina mais consistente para não deixar oportunidades esfriarem.',
    true,
    10
  ),
  (
    'site-institucional-aurora',
    'Site institucional Aurora',
    'Site institucional',
    'Aurora Arquitetura',
    false,
    null,
    null,
    array[]::text[],
    'https://example.com',
    'A marca tinha bons projetos, mas a presença digital não comunicava a qualidade do trabalho nem facilitava o contato com novos clientes.',
    array['Next.js', 'Tailwind CSS', 'Vercel']::text[],
    'Criamos uma experiência editorial com portfólio, navegação responsiva, páginas de serviço e chamadas de contato distribuídas ao longo da jornada.',
    'O novo site passou a apresentar o portfólio com mais clareza e criou um ponto de entrada confiável para pedidos de orçamento.',
    true,
    20
  ),
  (
    'automacao-operacional-nova',
    'Automação operacional Nova',
    'Automação',
    'Nova Operações',
    false,
    null,
    null,
    array[]::text[],
    null,
    'Processos manuais consumiam horas toda semana e deixavam informações importantes espalhadas entre planilhas, mensagens e tarefas individuais.',
    array['TypeScript', 'Supabase', 'APIs REST']::text[],
    'Mapeamos o fluxo, centralizamos os dados e automatizamos as etapas repetitivas com registros de status e histórico das operações.',
    'A operação ganhou previsibilidade, menos retrabalho e mais tempo para decisões que realmente exigem atenção do time.',
    false,
    30
  )
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  client_name = excluded.client_name,
  is_founder_project = excluded.is_founder_project,
  project_id = excluded.project_id,
  cover_image_url = excluded.cover_image_url,
  gallery_urls = excluded.gallery_urls,
  external_link = excluded.external_link,
  description = excluded.description,
  tech_stack = excluded.tech_stack,
  problem_solved = excluded.problem_solved,
  motivation = excluded.motivation,
  published = excluded.published,
  display_order = excluded.display_order,
  updated_at = now();

commit;
