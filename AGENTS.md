# AGENTS.md

## Meu Cliente

Meu Cliente e uma aplicacao web responsiva, acessada pelo navegador, com aparencia e experiencia de app mobile.

## Tipo de aplicacao

- Aplicacao web.
- Nao e React Native.
- Nao e app nativo.
- Nao e APK.
- Nao deve gerar estrutura de app mobile nativo.
- Deve abrir bem no desktop, mas com layout centralizado e largura confortavel.
- No celular, deve ocupar 100% da largura e priorizar interacoes simples.

## Objetivo do sistema

Criar um sistema simples para pequenos profissionais e negocios gerenciarem clientes, agendamentos e atendimentos sem complicacao.

O sistema precisa responder rapidamente a tres perguntas:

- Quem sao meus clientes?
- Quem eu tenho para atender hoje?
- O que ja foi feito com cada cliente?

## Stack oficial

- React
- TypeScript
- Ant Design Mobile com `antd-mobile`
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions somente quando necessario

## Regras de UI

- Usar `antd-mobile` como biblioteca principal.
- Nao usar `antd` desktop, a menos que o usuario solicite explicitamente.
- Preferir layout mobile-first.
- Preferir cards, listas e acoes rapidas em vez de tabelas grandes.
- Priorizar `Card`, `List`, `SearchBar`, `Tabs`, `PullToRefresh` e `InfiniteScroll` quando fizer sentido.
- Priorizar `Button`, `Dialog`, `Toast`, `Popup`, `ActionSheet` e `FloatingPanel` para acoes.
- Priorizar `Form`, `Input`, `TextArea`, `DatePicker`, `Picker`, `Selector` e `Switch` para formularios.
- Manter telas curtas, objetivas e faceis de tocar.
- Evitar fluxos com muitos campos por tela.
- Evitar dashboards pesados e interfaces com cara de sistema antigo.
- Usar estados de carregamento, vazio e erro quando fizer sentido.

## Regras de UX/UI

- `docs/UX_UI.md` e a referencia obrigatoria para telas, fluxos e componentes visuais.
- `docs/UX_REFERENCES.md` registra apenas inspiracao visual e nao deve ser copiado literalmente.
- Antes de criar telas novas, seguir o guia de UX/UI do projeto.
- Manter a experiencia simples o suficiente para qualquer pessoa usar sem treinamento.
- Priorizar clareza, poucos campos por tela e acoes rapidas.
- Evitar tabelas desktop, dashboards pesados e formulários longos no MVP.
- Garantir que a interface pareca uma aplicacao mobile, mesmo no navegador.
- Seguir a direcao visual oficial com header coral, cards arredondados, destaque amarelo e layout limpo.

## Regras de Firebase

- Usar Firebase como backend/BaaS do sistema.
- Usar Firebase Authentication para login.
- Usar Cloud Firestore como banco principal.
- Usar Firebase Storage para anexos e arquivos.
- Usar Cloud Functions somente quando houver necessidade real de operacoes sensiveis, integracoes externas, rotinas agendadas ou regras que nao devem rodar no cliente.
- Nao colocar regra sensivel apenas no front-end.
- Nao expor chaves secretas.
- Usar variaveis de ambiente para configuracao publica do Firebase.
- Proteger tudo por `businessId` para isolar os dados de cada conta.
- Pensar em permissao por usuario e negocio desde o inicio.
- Evitar chamadas diretas ao Firestore espalhadas em componentes.
- Preferir `services` e `hooks` para encapsular acesso ao Firebase.

## Modulos do MVP

1. Início
- Resumo do dia.
- Atendimentos de hoje.
- Proximos agendamentos.
- Clientes recentes.
- Atendimentos pendentes, se existirem.
- Acoes rapidas para novo cliente e novo agendamento.

2. Clientes
- Cadastro e consulta de clientes.
- Listagem mobile com cards ou lista.
- Tela de detalhe com dados, proximo agendamento, ultimo atendimento, historico, observacoes, anexos e acoes rapidas.

3. Agenda
- Visoes simples de hoje, proximos e semana, se fizer sentido.
- Sem calendario complexo no MVP.

4. Atendimentos
- Registro rapido do que foi feito.
- Ligacao com cliente e, quando existir, com agendamento.

5. Perfil do Cliente
- Tela central do produto.
- Deve mostrar rapidamente o historico do cliente e o que precisa acontecer agora.

## Entidades principais

1. `users`
- `id`
- `name`
- `email`
- `businessId`
- `role`
- `createdAt`
- `updatedAt`

2. `businesses`
- `id`
- `name`
- `ownerId`
- `segment`
- `createdAt`
- `updatedAt`

3. `clients`
- `id`
- `businessId`
- `name`
- `phone`
- `email`
- `birthDate`
- `notes`
- `status`
- `createdAt`
- `updatedAt`

4. `appointments`
- `id`
- `businessId`
- `clientId`
- `date`
- `time`
- `serviceType`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

5. `attendances`
- `id`
- `businessId`
- `clientId`
- `appointmentId`
- `date`
- `title`
- `description`
- `nextAction`
- `returnDate`
- `createdAt`
- `updatedAt`

6. `attachments`
- `id`
- `businessId`
- `clientId`
- `attendanceId`
- `fileName`
- `fileUrl`
- `fileType`
- `storagePath`
- `createdAt`
- `updatedAt`

## Fluxo principal

1. Cadastrar cliente.
2. Criar agendamento.
3. Chega o dia do atendimento.
4. Marcar como atendido.
5. Registrar o que foi feito.
6. Criar retorno, se necessario.

## O que nao fazer no MVP

- Nao criar financeiro complexo.
- Nao criar relatorios avancados.
- Nao criar multiplas unidades agora.
- Nao criar permissao complexa demais.
- Nao integrar WhatsApp agora.
- Nao criar dashboard cheio de graficos.
- Nao criar modulos especificos de odontologia.
- Nao transformar o produto em sistema vertical de clinica.

## Padroes de desenvolvimento

- Antes de alterar arquivos, entender a tarefa e a estrutura do projeto.
- Dividir o trabalho em etapas pequenas.
- Manter o foco no MVP e na simplicidade.
- Separar UI, hooks, services, firebase, types e utils.
- Usar tipos e interfaces para as entidades principais.
- Evitar `any` sem necessidade real.
- Nao misturar regra de negocio com componentes de UI.
- Nao espalhar acesso ao Firebase pelos componentes.
- Preferir componentes pequenos e reutilizaveis.
- Preservar comportamento existente quando a tarefa for de refatoracao ou correcao.
- Rodar build, lint e testes existentes quando fizer sentido.
- Nao instalar pacotes sem aprovacao.
- Nao alterar `package.json` sem aprovacao.
- Nao fazer commit.

## Regras para todos os agentes

- Usar o diretorio atual como contexto.
- Siga este `AGENTS.md` e a definicao do produto `Meu Cliente`.
- Preferir usar o `lead.yaml` como agente principal para coordenar tarefas de ponta a ponta.
- Seguir o fluxo por modulo definido em `docs/WORKFLOW_AGENTS.md` e no `lead.yaml`.
- Usar `docs/UX_UI.md` como referencia obrigatoria sempre que a tarefa envolver tela, fluxo ou componente visual.
- Tratar `docs/UX_REFERENCES.md` apenas como inspiracao visual, nunca como regra primaria.
- Proteger a simplicidade da experiencia.
- Manter a UI web com cara de app mobile.
- Evitar complexidade desnecessaria.
- Priorizar o MVP: cliente, agenda, atendimento e historico.
- Usar `executor.harness: codex`.
- Entregar trabalho com clareza.
- Informar arquivos alterados ao final.
- Explicar como testar.
- Indicar o proximo passo recomendado.

## Fluxo Git/GitHub

- Usar branch por tarefa.
- Nunca desenvolver feature direto na `main`.
- Usar Conventional Commits.
- Rodar build antes de commit.
- Nao versionar `.env.local`.
- Nao versionar `node_modules`.
- Nao fazer push, merge ou deploy sem confirmacao explicita.
- Preferir commits pequenos e focados.
- O agente git pode criar branch e commit local automaticamente apos validacao.
- Push e PR precisam de confirmacao do usuario.

## Fluxo por modulo

- O Lead deve planejar o modulo antes de alterar qualquer coisa.
- O Lead deve limitar o escopo ao modulo atual.
- O Lead deve usar o agente git_codex para branch, diff e commit local.
- O Lead deve usar uiux antes de frontend em telas e fluxos.
- O Lead deve usar firebase antes de mexer em Auth, Firestore, Storage ou rules.
- O Lead deve usar reviewer e tester antes de fechar o modulo.
- O Lead deve perguntar antes de push, salvo autorizacao explicita de modo automatico para o modulo.
