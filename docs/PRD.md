# Meu Cliente

## Visao geral

Meu Cliente e uma aplicacao web simples, com aparencia de app mobile, criada para pequenos profissionais e negocios gerenciarem clientes, agendamentos e atendimentos sem complicacao.

## Publico-alvo

- Dentistas
- Barbeiros
- Saloes de beleza
- Clinicas de estetica
- Personal trainers
- Psicologos
- Professores particulares
- Consultores
- Assistencias tecnicas
- Prestadores de servico
- Pequenos negocios com clientes recorrentes

## Problema

Muitos profissionais precisam acompanhar clientes, horarios e historico de atendimentos, mas os sistemas disponiveis costumam ser pesados, complicados ou focados em um nicho especifico.

## Solucao

Oferecer uma web app mobile-first, objetiva e facil de usar, com foco em:

1. cadastrar clientes
2. marcar agendamentos
3. registrar atendimentos
4. acompanhar o historico de cada cliente

## Objetivo do produto

Responder rapidamente a tres perguntas:

- Quem sao meus clientes?
- Quem eu tenho para atender hoje?
- O que ja foi feito com cada cliente?

## Stack oficial

- React
- TypeScript
- `antd-mobile`
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions somente quando necessario

## Módulos do MVP

### 1. Início

Tela inicial com resumo do dia.

Deve mostrar:

- Atendimentos de hoje
- Proximos agendamentos
- Clientes recentes
- Atendimentos pendentes, se existir
- Botao rapido para novo cliente
- Botao rapido para novo agendamento

### 2. Clientes

Cadastro e consulta de clientes.

Campos principais:

- Nome
- Telefone
- E-mail opcional
- Data de nascimento opcional
- Observacoes
- Status: ativo ou inativo

### 3. Agenda

Organizacao de agendamentos.

Visoes iniciais:

- Hoje
- Proximos
- Semana, se fizer sentido

Campos:

- Cliente
- Data
- Hora
- Tipo de atendimento ou servico
- Status
- Observacoes

Status:

- agendado
- confirmado
- atendido
- cancelado
- faltou

### 4. Atendimentos

Registro rapido do que foi feito.

Campos:

- Cliente
- Data do atendimento
- Tipo de atendimento
- Descricao do que foi feito
- Proxima acao
- Retorno necessario
- Data de retorno
- Anexos opcionais

### 5. Perfil do Cliente

Tela mais importante do produto.

Ao abrir um cliente, o usuario precisa ver rapidamente:

- Nome
- Telefone
- Proximo agendamento
- Ultimo atendimento
- Historico completo
- Observacoes
- Anexos
- Acoes rapidas

## Entidades principais

### `users`

- `id`
- `name`
- `email`
- `businessId`
- `role`
- `createdAt`
- `updatedAt`

### `businesses`

- `id`
- `name`
- `ownerId`
- `segment`
- `createdAt`
- `updatedAt`

### `clients`

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

### `appointments`

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

### `attendances`

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

### `attachments`

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

1. Cadastrar cliente
2. Criar agendamento
3. Chega o dia do atendimento
4. Marcar como atendido
5. Registrar o que foi feito
6. Criar retorno, se necessario

## Regras de UX

- Poucos campos por tela
- Fluxos curtos
- Botões grandes
- Cards e listas no lugar de tabelas grandes
- Navegacao com cara de app
- Layout centralizado no desktop
- 100% da largura no mobile
- Nada de interface pesada
- Qualquer pessoa sem conhecimento tecnico deve conseguir usar

## Regras de Firebase

- Firebase Authentication para login
- Cloud Firestore como banco principal
- Firebase Storage para anexos
- Cloud Functions somente quando necessario
- Nao colocar regra sensivel apenas no front-end
- Nao espalhar chamadas Firestore dentro de componentes
- Criar camada de services para Firebase
- Criar hooks para leitura, loading e erro
- Usar types/interfaces para entidades
- Nao expor chaves secretas
- Usar variaveis de ambiente para a configuracao publica
- Proteger os dados por `businessId`

## Fora do escopo do MVP

- Financeiro complexo
- Relatorios avancados
- Multiplas unidades
- Permissoes complexas demais
- Integracao com WhatsApp
- Dashboard cheio de graficos
- Modulos especificos de odontologia
- Sistema verticalizado para uma unica profissao

## Proximos passos

1. Definir a modelagem inicial das collections no Firestore.
2. Estruturar Auth e contexto de negocio.
3. Criar layout base com navegacao inferior.
4. Implementar clientes, agenda, atendimentos e perfil do cliente.
5. Adicionar testes de fluxo e validacao de permissao por `businessId`.
