# Roadmap de Modulos - Meu Cliente

## Visao geral

O Meu Cliente sera desenvolvido por modulos pequenos, com o Lead como orquestrador principal.

Regras do roadmap:

- seguir o escopo de um modulo por vez
- nao criar funcionalidades fora do modulo atual
- manter a experiencia simples
- priorizar web mobile-first com cara de app
- usar `git_codex` para branch, diff e commit local
- usar `uiux`, `frontend`, `firebase`, `reviewer`, `tester`, `debugger` e `refactor` conforme a necessidade
- push e deploy exigem confirmacao explicita, salvo autorizacao de `modo automatico autorizado para este modulo`

## Módulo 0: Configuração do sistema

Objetivo:

- garantir Firebase Hosting funcionando
- garantir `firebase.json` com `public` apontando para `dist`
- garantir `.env.example`
- garantir `.gitignore`
- garantir docs base
- garantir agentes configurados

Entregas esperadas:

- configuracao inicial do projeto pronta para desenvolvimento e deploy
- base de documentacao minima validada

## Módulo 1: UX/UI e AppShell

Objetivo:

- criar layout base
- AppShell centralizado no desktop
- header coral
- fundo `#F5F3EF`
- bottom navigation
- rotas: Início, Clientes, Agenda, Atendimentos e Mais
- dados mockados

Entregas esperadas:

- estrutura visual principal do app
- navegacao base funcionando

## Módulo 2: Login e cadastro

Objetivo:

- tela de login
- botao Entrar com Google
- tela de carregamento
- Toast de erro
- redirecionamento apos login
- protecao de rotas

Backend/Firebase:

- Firebase Authentication com Google
- auth service
- `useAuth`
- criacao inicial de usuario no Firestore
- criacao ou associacao a `businessId`
- logout

Entregas esperadas:

- autenticao funcional e simples
- usuario reconhecido no Firestore

## Módulo 3: Clientes

Objetivo:

- tela Clientes
- busca
- lista em cards
- novo cliente
- editar cliente
- detalhes do cliente

Backend/Firebase:

- `clientsService`
- `useClients`
- collection `clients`
- CRUD com `businessId`
- regras basicas de acesso por usuario logado

Entregas esperadas:

- fluxo completo de cadastro e consulta de clientes

## Módulo 4: Agenda

Objetivo:

- tela Agenda
- tabs Hoje e Proximos
- novo agendamento
- cards por horario
- status: agendado, confirmado, atendido, cancelado e faltou

Backend/Firebase:

- `appointmentsService`
- `useAppointments`
- collection `appointments`
- queries por `businessId` e data

Entregas esperadas:

- agenda simples com visoes essenciais

## Módulo 5: Atendimentos

Objetivo:

- tela Atendimentos
- registrar atendimento
- historico simples
- formulario com descricao e proxima acao

Backend/Firebase:

- `attendancesService`
- `useAttendances`
- collection `attendances`
- relacionamento com `clientId` e `appointmentId`

Entregas esperadas:

- registro rapido do que foi feito

## Módulo 6: Perfil do cliente e histórico

Objetivo:

- tela completa do cliente
- dados do cliente
- proximo agendamento
- ultimo atendimento
- historico
- acoes rapidas: agendar e registrar atendimento

Backend/Firebase:

- buscar dados agregados por `clientId`
- hooks especificos para perfil do cliente

Entregas esperadas:

- tela central do produto consolidada

## Módulo 7: Anexos

Objetivo:

- upload simples em atendimento ou cliente
- lista de anexos

Backend/Firebase:

- Firebase Storage
- `attachmentsService`
- collection `attachments`
- regras de Storage por `businessId`

Entregas esperadas:

- anexos integrados ao fluxo principal

## Módulo 8: Permissões e negócio

Objetivo:

- tela Mais
- dados do usuario
- dados do negocio
- logout

Backend/Firebase:

- `users`
- `businesses`
- roles basicos: owner, admin, attendant
- protecao por `businessId`

Entregas esperadas:

- estrutura minima de negocio e permissao

## Módulo 9: Review final e deploy

Objetivo:

- revisao geral
- build final
- corrigir erros
- deploy Firebase Hosting
- criar documentacao de uso

Regras:

- nao fazer deploy se build falhar
- nao fazer deploy com `.env.local` exposto
- informar URL publicada ao final

Entregas esperadas:

- versao final pronta para publicacao

## Ordem recomendada de agentes por modulo

1. `lead`
2. `git_codex`
3. `uiux`, quando houver tela ou fluxo
4. `frontend`
5. `firebase`, quando houver backend ou regras
6. `reviewer`
7. `tester`
8. `debugger`, se houver falha
9. `refactor`, se houver necessidade de limpeza

