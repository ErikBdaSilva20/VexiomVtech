# 5. Requisitos técnicos

## Primeira versão

- Site responsivo.
- Código organizado e fácil de manter.
- Formulário de contato e solicitação de conversa funcional.
- Links para WhatsApp e e-mail.
- SEO básico.
- Publicação inicial utilizando a Vercel.
- Uso inicial do plano gratuito do Supabase.
- Certificado HTTPS.
- Política de privacidade, se houver coleta de dados.

## Stack definida

- Next.js.
- Roteamento do Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Zod para validação de dados.
- Supabase para banco de dados, autenticação e recursos de backend.
- Supabase Auth para login e controle de acesso.
- Vercel para hospedagem e publicação.
- Biblioteca de ícones compatível com o ecossistema escolhido.

## Área administrativa

- A área administrativa ficará em uma rota separada da área pública.
- O acesso será permitido somente para usuários autenticados.
- A Home terá temporariamente um botão de login para facilitar o acesso dos responsáveis.
- O sistema terá dois níveis de acesso iniciais:
  - `super_admin` — acesso irrestrito a todas as telas, dashboards e informações da aplicação.
  - `employer` — acesso à área operacional de organização e acompanhamento de leads.

### Área do super admin

- Dashboard financeiro.
- Controle do valor investido na Vexiom.
- Controle do valor gerado pela Vexiom.
- Controle dos gastos relacionados aos projetos.
- Estrutura preparada para receber novos indicadores no futuro.

### Área do employer

- Organização dos leads.
- Registro de datas de contato.
- Registro de respostas e observações.
- Controle de datas de follow-up.
- Evolução futura com novos campos e etapas operacionais.

## Captação e gestão de leads

- O visitante poderá preencher um formulário com seus dados e explicar sua necessidade.
- O fluxo inicial poderá utilizar formulários integrados ao Google Sheets.
- A Vexiom deverá ter uma tela administrativa para consultar e organizar os leads recebidos.
- O acesso à tela administrativa deverá ser protegido por autenticação.
- O sistema deverá evitar duplicidade acidental e informar ao visitante se o envio foi concluído ou apresentou erro.
- Usuários autenticados deverão receber notificações dentro da própria aplicação quando houver atualizações operacionais relevantes.

## Métricas e notificações

- Não haverá dependência de ferramenta paga de analytics na primeira versão.
- Métricas externas só serão adicionadas se houver uma alternativa gratuita adequada.
- As notificações operacionais serão feitas dentro da própria aplicação, utilizando a infraestrutura do Supabase quando necessário.

## Decisões ainda pendentes

- Definir se o Google Sheets será apenas uma integração complementar ou se será a fonte principal dos leads.
- Definir a estrutura final das tabelas do Supabase para leads, usuários, permissões e dados financeiros.
- Definir a biblioteca de ícones.
- Domínio oficial.
- Definir as permissões específicas do `employer`; o `super_admin` terá acesso total por padrão.

## Critérios de qualidade

- Testar em diferentes tamanhos de tela.
- Validar todos os links e formulários.
- Verificar desempenho e acessibilidade básica.
- Revisar ortografia e consistência da marca.
- Fazer backup e manter o código versionado.
