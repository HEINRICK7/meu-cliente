# Auditoria de Arquitetura - Tarefas para Odysseus

Data: 2026-07-01

Observacao: a tentativa de criar tarefas diretamente no Odysseus via Rube falhou por erro de conexao com `https://rube.app/mcp`. Este arquivo deixa as tarefas prontas para cadastro/importacao no Odysseus.

## P0 - Corrigir isolamento multi-tenant nas regras do Firestore

Prioridade: Critica
Modulo: Firebase / Seguranca

Problema:
As regras permitem que qualquer usuario autenticado atualize seu proprio documento `users/{uid}` sem restringir campos. Como `currentBusinessId()` usa `users/{uid}.businessId` como fonte de autorizacao, um usuario pode alterar o proprio `businessId` e passar a acessar dados de outro negocio se conhecer esse ID. A tela Mais tambem mostra e permite copiar o ID do negocio, aumentando a chance de vazamento operacional.

Referencias:
- `firestore.rules:13`
- `firestore.rules:23`
- `firestore.rules:47`
- `src/features/more/MoreScreen.tsx:207`
- `src/features/more/MoreScreen.tsx:293`

Escopo sugerido:
- Separar campos editaveis pelo usuario de campos sensiveis (`businessId`, `role`, `id`, `createdAt`).
- Bloquear alteracao client-side de `businessId` e `role`.
- Validar `users/{uid}` com `diff().affectedKeys()` ou modelo equivalente.
- Decidir se o ID do negocio deve aparecer na UI do MVP.
- Revisar se `owner`, `admin` e `attendant` precisam de regras distintas agora ou se todos ficam como owner ate o modulo de permissoes.

Criterios de aceite:
- Usuario nao consegue alterar `businessId` nem `role` do proprio documento pelo cliente.
- A leitura/escrita de `clients`, `appointments`, `attendances` e `attachments` depende de associacao confiavel ao negocio.
- Regras cobrem create/update com tipos e campos permitidos.
- Emulador ou teste manual documentado valida tentativa de trocar `businessId`.

## P0 - Padronizar contrato de dominio e documentos persistidos

Prioridade: Critica
Modulo: Arquitetura / Firebase

Problema:
Os tipos do dominio nao representam completamente o que os services salvam. `clients`, `appointments` e `attendances` persistem `ownerId`, mas as interfaces principais nao declaram esse campo. Varios campos sensiveis aparecem como opcionais no front, embora as regras dependam deles. Isso facilita bugs silenciosos entre UI, service e rules.

Referencias:
- `src/types/domain.ts:72`
- `src/types/domain.ts:87`
- `src/types/domain.ts:101`
- `src/services/clientsService.ts:95`
- `src/services/appointmentsService.ts:162`
- `src/services/attendancesService.ts:119`

Escopo sugerido:
- Criar tipos separados para `ClientDocument`, `AppointmentDocument`, `AttendanceDocument`, `AttachmentDocument` e inputs de formulario.
- Tornar `businessId` e `ownerId` obrigatorios nos tipos persistidos.
- Centralizar normalizadores/conversores de documento Firestore.
- Atualizar services/hooks para expor somente modelos seguros para UI.

Criterios de aceite:
- TypeScript impede salvar documento sem `businessId` e `ownerId` quando aplicavel.
- Tipos de input de formulario nao carregam campos de autorizacao.
- Services sao o unico lugar que monta campos sensiveis de persistencia.

## P1 - Endurecer validacao das regras para todas as collections

Prioridade: Alta
Modulo: Firebase / Security Rules

Problema:
As regras validam melhor `appointments`, mas `clients`, `attendances` e `attachments` quase nao validam tipos, campos permitidos, tamanho de strings ou relacao entre documento e Storage. Updates podem transformar documentos validos em dados corrompidos, muito grandes ou inconsistentes. Deletes tambem estao liberados para qualquer usuario do negocio.

Referencias:
- `firestore.rules:31`
- `firestore.rules:56`
- `firestore.rules:76`
- `firestore.rules:85`
- `storage.rules:17`

Escopo sugerido:
- Definir `hasOnly()` por collection.
- Validar tipos e tamanho maximo de nomes, telefones, notas, descricoes, URLs e caminhos.
- Validar enums de status e datas no formato definido pelo app.
- Restringir delete ou trocar para soft delete com `status`.
- Em `attachments`, validar que `storagePath` pertence a `businessId` e ao `attachmentId`.

Criterios de aceite:
- Create e update usam a mesma politica de tipo/campos permitidos.
- Tentativas de inserir campos extras ou valores gigantes sao bloqueadas.
- Delete fica explicitamente justificado ou removido.

## P1 - Criar camada de dados compartilhada para evitar assinaturas duplicadas

Prioridade: Alta
Modulo: Frontend / Arquitetura

Problema:
Cada tela abre seus proprios listeners para colecoes inteiras. `App` assina agendamentos e atendimentos para notificacoes, `Clientes` assina clientes, agendamentos e atendimentos, `Agenda` assina clientes e agendamentos, e `Atendimentos` assina clientes, agendamentos e atendimentos. Isso aumenta custo, trafego e estados divergentes conforme o app cresce.

Referencias:
- `src/App.tsx:41`
- `src/features/clients/ClientsScreen.tsx:134`
- `src/features/clients/ClientsScreen.tsx:138`
- `src/features/schedule/ScheduleScreen.tsx:134`
- `src/features/attendances/AttendancesScreen.tsx:57`
- `src/features/attendances/AttendancesScreen.tsx:62`

Escopo sugerido:
- Criar um provider de dados do negocio ou cache simples por `businessId`.
- Reusar as mesmas assinaturas em Inicio, Clientes, Agenda, Atendimentos e AppShell.
- Criar seletores derivados para hoje, proximos, historico do cliente e pendencias.
- Evitar carregar colecoes inteiras quando uma tela precisa de subconjunto.

Criterios de aceite:
- Uma collection principal tem no maximo uma assinatura ativa por sessao de usuario.
- Telas consomem dados via selectors/hooks derivados.
- Estados de loading/erro continuam claros por tela.

## P1 - Desenhar consultas e indices por caso de uso

Prioridade: Alta
Modulo: Firebase / Performance

Problema:
Os services leem colecoes inteiras por `businessId` e filtram/ordenam no cliente. Para o MVP pequeno funciona, mas agenda, historico, anexos e notificacoes vao degradar rapidamente. O roadmap pede queries por `businessId` e data, mas isso ainda nao esta refletido na camada de dados.

Referencias:
- `src/services/appointmentsService.ts:121`
- `src/services/attendancesService.ts:80`
- `src/services/attachmentsService.ts:84`
- `firestore.indexes.json`

Escopo sugerido:
- Criar queries especificas: agenda por intervalo, historico por `clientId`, anexos por `clientId`/`attendanceId`.
- Atualizar `firestore.indexes.json` com indices compostos necessarios.
- Evitar ordenacao pesada no cliente quando Firestore puder ordenar.
- Documentar padrao de query por modulo.

Criterios de aceite:
- Agenda carrega por janela de data, nao a collection inteira.
- Perfil do cliente carrega somente dados do cliente selecionado.
- Indices necessarios estao versionados e documentados.

## P2 - Separar componentes de tela, formulario e regras de apresentacao

Prioridade: Media
Modulo: Frontend / Refactor

Problema:
Telas como `ClientsScreen`, `ScheduleScreen` e `AttendancesScreen` acumulam estado de formulario, seletores, filtros, derivacoes, mensagens de erro e layout. Isso dificulta testes e aumenta o risco de regressao ao criar novos modulos.

Referencias:
- `src/features/clients/ClientsScreen.tsx:132`
- `src/features/schedule/ScheduleScreen.tsx:132`
- `src/features/attendances/AttendancesScreen.tsx:55`

Escopo sugerido:
- Extrair formularios para componentes controlados por props.
- Extrair hooks de view-model por tela (`useClientProfileView`, `useScheduleView`, `useAttendanceEditor`).
- Reusar funcoes de ordenacao/data em services ou utils.
- Manter UI com `antd-mobile` e guia `docs/UX_UI.md`.

Criterios de aceite:
- Cada tela principal fica focada em composicao.
- Formularios podem ser testados isoladamente.
- Nenhum comportamento visual existente e removido.

## P2 - Revisar modulo de anexos e Storage antes de expandir uso

Prioridade: Media
Modulo: Anexos / Firebase Storage

Problema:
O upload aceita qualquer arquivo que o navegador entregue e as regras de Storage permitem write no caminho do negocio sem validar tamanho, tipo de arquivo ou consistencia com o documento Firestore. Tambem nao ha fluxo de exclusao/limpeza do arquivo quando o documento for removido.

Referencias:
- `src/services/attachmentsService.ts:105`
- `src/services/attachmentsService.ts:127`
- `storage.rules:17`

Escopo sugerido:
- Definir tipos permitidos no MVP: imagem/PDF ou somente imagem.
- Validar tamanho maximo no front e nas rules.
- Amarrar `storagePath` ao documento `attachments/{attachmentId}`.
- Definir estrategia de exclusao ou soft delete.

Criterios de aceite:
- Arquivos fora do tipo/tamanho permitido sao bloqueados antes do upload e pelas rules.
- Documento de anexo e arquivo no Storage ficam consistentes.
- Comportamento de exclusao fica definido.

## P2 - Formalizar ou adiar modulo de notificacoes push

Prioridade: Media
Modulo: Notificacoes

Problema:
Push notifications ja aparecem no app, mas nao constam no roadmap do MVP. O token e salvo direto em `users/{uid}` e depende das regras atuais de user update, que tambem sao a origem do problema critico de autorizacao.

Referencias:
- `src/App.tsx:68`
- `src/services/pushNotificationsService.ts:82`
- `src/services/pushNotificationsService.ts:108`
- `src/features/more/MoreScreen.tsx:243`

Escopo sugerido:
- Decidir se notificacoes ficam no MVP ou voltam para backlog.
- Se ficarem, criar modulo explicito com permissao, regras e modelo de dados.
- Considerar subcollection/device tokens em vez de campos soltos no user profile.
- Separar configuracao de service worker e mensagens de produto.

Criterios de aceite:
- Roadmap reflete a decisao.
- Regras permitem atualizar token sem permitir alterar `businessId`/`role`.
- UI de notificacoes continua simples ou e removida temporariamente.

## P3 - Reduzir bundle inicial com code splitting por rota

Prioridade: Baixa
Modulo: Performance

Problema:
O build passa, mas gera bundle JS de aproximadamente 1,18 MB minificado e o Vite alerta que o chunk passa de 500 kB. Para uma web app com experiencia mobile, isso pode afetar carregamento em conexoes lentas.

Referencias:
- `src/App.tsx:222`
- Resultado de `npm run build`: `dist/assets/index-*.js` com 1.183,62 kB.

Escopo sugerido:
- Usar `React.lazy`/`Suspense` por telas principais.
- Avaliar chunk manual para Firebase/antd-mobile se necessario.
- Garantir loading simples e consistente com `LoadingState`.

Criterios de aceite:
- Bundle inicial fica abaixo do limite configurado ou o limite e justificado.
- Rotas carregam sob demanda sem quebrar navegacao por hash.
- Build continua passando.

## Verificacao realizada

- `npm run build` executado com sucesso.
- Aviso restante: chunk JS maior que 500 kB.
- Nenhuma alteracao de codigo de aplicacao foi feita nesta auditoria.
