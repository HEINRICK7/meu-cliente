# UX/UI - Meu Cliente

## 1. Principio principal

A experiencia deve ser simples o suficiente para qualquer pessoa usar sem treinamento.

O usuario deve conseguir rapidamente:

- cadastrar um cliente
- criar um agendamento
- registrar um atendimento
- ver o historico de um cliente

## 2. Personalidade visual

O sistema deve parecer:

- simples
- limpo
- confiavel
- moderno
- leve
- amigavel
- profissional sem ser complicado

Evitar:

- visual corporativo pesado
- dashboards cheios
- tabelas grandes
- muitos filtros
- formularios longos
- telas com muita informacao
- linguagem tecnica

## 3. Direção visual oficial

O Meu Cliente deve ter aparência de aplicativo mobile moderno, mesmo sendo uma aplicação web.

### Estilo

- simples
- limpo
- amigavel
- profissional
- moderno
- leve
- com cara de app de agenda e atendimento

### Paleta de cores

- Cor primaria: `#EB5A3C`
- Cor primaria escura: `#D94B31`
- Cor de destaque: `#F8D85A`
- Fundo geral: `#F5F3EF`
- Card branco: `#FFFFFF`
- Texto principal: `#111111`
- Texto secundario: `#6B6B6B`
- Borda suave: `#EAE7E2`
- Acao escura: `#111111`

### Regras de layout

- No desktop, o sistema deve ficar centralizado, com largura maxima parecida com tela de celular.
- No mobile, ocupar 100% da tela.
- Usar `AppShell` com largura maxima entre `420px` e `480px`.
- Usar header superior com cor primaria.
- Usar bottom navigation fixa.
- Usar cards com border-radius grande.
- Usar espacamento confortavel.
- Evitar telas muito cheias.
- Evitar tabela desktop.
- Usar cards e listas no lugar de tabelas.

### Regras de cards

- Cards principais devem ter bordas arredondadas.
- Cards de destaque podem usar amarelo suave.
- Cards normais devem ser brancos.
- Informacao deve aparecer em blocos curtos e claros.
- Priorizar cards grandes e legiveis em vez de densidade excessiva.

### Regras de botoes

- Botoes principais devem usar coral/laranja.
- Botoes de acao rapida podem ser circulares escuros.
- Acoes mais importantes devem ter hierarquia visual clara.
- Usar Toast para feedback.
- Usar EmptyState amigavel em telas sem dados.

### Regras de formularios

- Usar componentes do `antd-mobile` como fonte principal de UI do app.
- Nao criar controles HTML nativos visiveis quando houver componente equivalente no `antd-mobile`.
- Campos de data devem usar `DatePicker` do `antd-mobile`.
- Campos de hora devem usar `Picker` do `antd-mobile`.
- Campos de e-mail, telefone e dinheiro devem usar componentes do `antd-mobile` com tipo/teclado adequado.
- Campos de agenda ou selecao de cliente devem usar busca, lista, `Selector`, `Picker` ou componentes equivalentes do `antd-mobile`.
- Evitar texto livre quando o dado tiver formato previsivel ou lista de opcoes.

### Catalogo oficial de componentes

Usar preferencialmente os componentes do `antd-mobile` abaixo, conforme o tipo de interacao:

- Base e layout: `Button`, `AutoCenter`, `Divider`, `Grid`, `SafeArea`, `Space`.
- Navegacao: `CapsuleTabs`, `JumboTabs`, `NavBar`, `SideBar`, `TabBar`, `Tabs`.
- Dados: `Avatar`, `Card`, `Collapse`, `Ellipsis`, `FloatingPanel`, `Image`, `ImageViewer`, `InfiniteScroll`, `List`, `PageIndicator`, `Segmented`, `Steps`, `Swiper`, `Tag`, `Footer`.
- Entrada: `Cascader`, `CascaderView`, `CheckList`, `Checkbox`, `Form`, `Input`, `Picker`, `PickerView`, `Radio`, `Rate`, `SearchBar`, `Selector`, `Slider`, `Stepper`, `Switch`, `TextArea`.
- Feedback: `ActionSheet`, `Dialog`, `Empty`, `ErrorBlock`, `Loading`, `Mask`, `Modal`, `Popover`, `Popup`, `ProgressBar`, `ProgressCircle`, `PullToRefresh`, `Result`, `Skeleton`, `SwipeAction`, `Toast`.
- Orientacao: `Badge`, `NoticeBar`.
- Outros: `ConfigProvider`, `Calendar`, `CalendarPicker`, `CalendarPickerView`, `Dropdown`, `FloatingBubble`, `ImageUploader`, `NumberKeyboard`, `PasscodeInput`, `ResultPage`, `TreeSelect`, `VirtualInput`.

### Comportamento no desktop

- Centralizar o conteudo.
- Manter largura maxima confortavel.
- Evitar esticar a interface na tela inteira.
- Fazer parecer um app aberto no navegador.

### Comportamento no mobile

- Ocupar 100% da largura.
- Manter navegacao inferior fixa.
- Usar botoes grandes.
- Deixar as acoes principais sempre visiveis.
- Priorizar toque facil e leitura rapida.

### Aplicação por tela

#### Tela Início

- Header coral com saudacao.
- Resumo do dia.
- Destaque amarelo para o proximo atendimento importante.
- Cards brancos para demais atendimentos.
- Botoes rapidos para novo cliente e novo agendamento.

#### Tela Clientes

- `SearchBar` no topo.
- Lista de clientes em cards brancos.
- Botao principal coral para novo cliente.
- Cliente com nome, telefone, status e proximo agendamento.

#### Tela Agenda

- Header ou secao com dias da semana.
- Cards por horario.
- Status visual.
- Acao rapida para confirmar, cancelar, remarcar ou registrar atendimento.

#### Tela Detalhes do Cliente

- Card principal com nome e telefone.
- Cards de proximo agendamento, ultimo atendimento e historico.
- Botoes grandes para Agendar e Registrar atendimento.

#### Tela Atendimentos

- Formulario simples.
- Campos em blocos arredondados.
- Botao principal coral.
- Feedback com Toast ao salvar.

## 4. Layout geral

O sistema e web, mas com cara de app mobile.

Em desktop:

- centralizar o conteudo
- usar largura maxima confortavel
- parecer um app aberto no navegador
- evitar esticar conteudo na tela toda

Em mobile:

- ocupar 100% da largura
- navegacao inferior fixa
- botoes grandes
- acoes principais sempre visiveis

Sugestao de AppShell:

- Header simples no topo
- Conteudo central
- BottomNavigation fixa
- Espacamento confortavel
- Fundo claro
- Cards com bordas suaves

## 5. Navegacao principal

Menu inferior:

1. Inicio
2. Clientes
3. Agenda
4. Atendimentos
5. Mais

Regras:

- Navegacao simples
- No maximo 5 itens principais
- Evitar menus escondidos no MVP
- A acao principal da tela deve estar sempre clara

## 6. Tela Inicio

Objetivo:
Mostrar o que o usuario precisa fazer hoje.

Deve conter:

- saudacao simples
- resumo do dia
- atendimentos de hoje
- proximos agendamentos
- clientes recentes
- botao rapido para novo cliente
- botao rapido para novo agendamento

Componentes sugeridos:

- Card
- List
- Button
- EmptyState
- Toast para feedback

Visual:

- Cards empilhados
- Informacao resumida
- Botoes de acao rapida
- Sem graficos no MVP

## 7. Tela Clientes

Objetivo:
Encontrar e cadastrar clientes rapidamente.

Deve conter:

- SearchBar no topo
- botao "Novo cliente"
- lista de clientes em cards
- status simples: ativo/inativo
- telefone visivel
- acao rapida para abrir detalhes

Evitar:

- tabela
- muitos filtros
- colunas
- informacoes demais no card

Card de cliente deve mostrar:

- nome
- telefone
- ultimo atendimento, se existir
- proximo agendamento, se existir
- status

## 8. Tela Detalhes do Cliente

Objetivo:
Mostrar tudo que importa sobre um cliente.

Essa e uma tela central do sistema.

Deve mostrar:

- nome
- telefone
- observacoes importantes
- proximo agendamento
- ultimo atendimento
- historico de atendimentos
- anexos, se existirem

Acoes principais:

- Agendar
- Registrar atendimento
- Editar cliente
- Ligar ou copiar telefone, se fizer sentido

Layout:

- topo com dados do cliente
- cards de resumo
- historico em lista
- botoes grandes

A pergunta que essa tela deve responder:
"O que ja aconteceu com esse cliente e o que eu preciso fazer agora?"

## 9. Tela Agenda

Objetivo:
Ver quem precisa ser atendido.

Visualizacoes iniciais:

- Hoje
- Proximos
- Semana, somente se ficar simples

Cada agendamento deve aparecer como card/lista com:

- horario
- nome do cliente
- tipo de atendimento
- status
- observacoes curtas

Status:

- Agendado
- Confirmado
- Atendido
- Cancelado
- Faltou

Acoes:

- confirmar
- marcar como atendido
- cancelar
- remarcar
- registrar atendimento

Evitar:

- calendario complexo no MVP
- visual mensal pesado
- muitos filtros

## 10. Tela Atendimentos

Objetivo:
Registrar rapidamente o que foi feito.

Deve conter:

- cliente
- data
- tipo de atendimento
- descricao
- proxima acao
- retorno necessario
- data de retorno
- anexos opcionais

UX:

- formulario simples
- poucos campos obrigatorios
- textos claros
- botao principal fixo ou bem visivel
- feedback com Toast ao salvar

## 11. Tela Mais

Objetivo:
Configuracoes simples.

Pode conter:

- dados do negocio
- perfil do usuario
- sair da conta
- configuracoes futuras

Evitar colocar muitas opcoes agora.

## 12. Componentes padrao

Criar ou manter componentes reutilizaveis:

- AppShell
- BottomNavigation
- PageHeader
- EmptyState
- LoadingState
- ClientCard
- AppointmentCard
- AttendanceCard
- QuickActionButton
- StatusTag
- ConfirmDialog

## 13. Componentes Ant Design Mobile recomendados

Usar preferencialmente:

- Button
- Card
- List
- Form
- Input
- TextArea
- SearchBar
- Tabs
- Dialog
- Toast
- Popup
- ActionSheet
- DatePicker
- Picker
- Selector
- Switch
- PullToRefresh
- InfiniteScroll
- FloatingPanel

Evitar no MVP:

- Table desktop
- dashboard pesado
- grids complexos
- formularios longos

## 14. Estados de tela

Toda tela importante deve prever:

### Loading
Mostrar carregamento simples.

### Empty State
Quando nao tiver dados, mostrar mensagem amigavel e botao de acao.

Exemplos:

- "Nenhum cliente cadastrado ainda."
- "Cadastre seu primeiro cliente para comecar."
- Botao: "Novo cliente"

### Error State
Mostrar erro simples e acao para tentar novamente.

### Success Feedback
Usar Toast para acoes salvas.

Exemplos:

- "Cliente salvo com sucesso."
- "Agendamento criado."
- "Atendimento registrado."

## 15. Linguagem da interface

Usar textos simples.

Preferir:

- "Novo cliente"
- "Agendar"
- "Registrar atendimento"
- "Salvar"
- "Cancelar"
- "Hoje"
- "Proximos"

Evitar:

- termos tecnicos
- textos longos
- linguagem corporativa
- mensagens dificeis de entender

## 16. Regras de formulario

- Poucos campos obrigatorios.
- Nome e telefone devem ser suficientes para cadastrar cliente.
- Campos opcionais devem ser claramente opcionais.
- Evitar formularios enormes.
- Se uma tela ficar grande demais, dividir em secoes simples.
- Botao principal claro no final.

## 17. Cores e estilo

O visual deve seguir a direcao oficial desta documentacao.

Preferir:

- fundo geral `#F5F3EF`
- cards brancos
- destaque amarelo em pontos importantes
- botoes principais em coral/laranja
- botao de acao escuro quando for acao rapida
- bordas suaves
- sombras leves
- textos bem legiveis

Nao definir cores extras fora da paleta oficial sem necessidade.

## 18. Prioridade de UX no MVP

Prioridade maxima:

1. Cadastrar cliente rapido.
2. Agendar atendimento rapido.
3. Registrar atendimento rapido.
4. Ver historico do cliente rapido.

Tudo que nao ajudar nisso deve ficar fora do MVP.

## 19. Checklist de UX

Antes de concluir qualquer tela, verificar:

- A tela funciona bem em celular?
- A acao principal esta clara?
- Tem informacao demais?
- O usuario consegue concluir a tarefa em poucos passos?
- Existe estado vazio?
- Existe loading?
- Existe feedback de sucesso?
- O texto esta simples?
- Evitou tabela desktop?
- Usou componentes do `antd-mobile`?
