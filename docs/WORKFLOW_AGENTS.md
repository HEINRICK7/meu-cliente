# Workflow de Agentes - Meu Cliente

## Loop principal

O fluxo padrao do projeto deve seguir esta sequencia, com o `lead` delegando para sub-agents reais sempre que possivel:

1. Planejamento
2. Git
3. UX/UI
4. Frontend
5. Firebase
6. Review
7. Teste
8. Commit
9. Deploy

## Regras do loop

- O `lead` e o orquestrador principal e deve coordenar, nao acumular o trabalho das especialidades.
- Sempre que o runtime suportar, o `lead` deve chamar os sub-agents declarados no `lead.yaml`:
  - `uiux`
  - `arquiteto`
  - `frontend`
  - `firebase`
  - `reviewer`
  - `tester`
  - `debugger`
  - `refactor`
  - `git`
- O `git` cuida de branch, status, diff, commit local e preparo para GitHub.
- O `uiux` define ou valida a experiencia visual quando a tarefa envolver tela, fluxo ou hierarquia.
- O `frontend` implementa a interface web mobile-first com `antd-mobile`.
- O `firebase` ajusta Auth, Firestore, Storage, rules e services.
- O `reviewer` valida codigo, UX, TypeScript, Firebase, seguranca e escopo.
- O `tester` roda build, lint e testes.
- O `debugger` entra quando surgir falha ou comportamento inesperado.
- O `refactor` entra quando houver necessidade de simplificacao estrutural.

## Planejamento

- Entender o objetivo do modulo.
- Ler `AGENTS.md`.
- Ler `docs/PRD.md`, se existir.
- Ler `docs/UX_UI.md`, se existir.
- Ler `docs/UX_REFERENCES.md`, se existir.
- Dividir em pequenas etapas.
- Definir os agentes que serao usados.

## Git

- O `lead` deve acionar o sub-agent `git` para verificar `git status`.
- Se estiver na `main`, criar branch automatica.
- Nunca trabalhar feature direto na `main`.
- Nomear branch com base no tipo do trabalho e no nome curto do modulo.
- Revisar arquivos sensiveis antes de seguir.

## UX/UI

- O `lead` deve acionar o sub-agent `uiux` para qualquer tela ou fluxo visual.
- Validar simplicidade, cards, botoes grandes, empty states e navegacao clara.

## Frontend

- O `lead` deve acionar o sub-agent `frontend` para telas, componentes e hooks visuais.
- Manter layout mobile-first.
- Evitar tabelas e padroes de desktop.

## Firebase

- O `lead` deve acionar o sub-agent `firebase` para Auth, Firestore, Storage e regras.
- Evitar chamadas Firebase espalhadas em componentes.
- Proteger dados por `businessId`.
- Nao expor `.env.local` nem configs reais.

## Review

- O `lead` deve acionar o sub-agent `reviewer` para revisar codigo, UX, seguranca, escopo e tamanho do commit.
- Conferir branch correta e arquivos sensiveis staged.
- Conferir se `dist` ou `build` nao entram sem necessidade.

## Teste

- O `lead` deve acionar o sub-agent `tester`.
- Rodar `npm run build`.
- Rodar `npm run lint` se existir.
- Rodar testes existentes, se houver.
- Se falhar, usar `debugger` para a menor correcao possivel e validar novamente.

## Commit

- O `lead` deve acionar o sub-agent `git` para revisao final, branch, diff e commit local.
- Conferir `git status`.
- Conferir `git diff --stat`.
- Validar que nao ha arquivos sensiveis no commit.
- Criar commit local com Conventional Commits.

## Deploy

- Fazer deploy apenas com aprovacao explicita do usuario ou com a autorizacao especial de `modo automatico autorizado para este modulo`.
- Nunca fazer deploy se o build falhar.
- Informar a URL publicada ao final.

## Resumo final

Sempre entregar:

- modulo executado
- branch usada
- arquivos criados ou alterados
- o que foi implementado no frontend
- o que foi implementado no Firebase/backend
- resultado do review
- resultado dos testes
- commit criado
- se houve deploy
- proximo modulo recomendado
