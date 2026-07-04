# Manual do usuário — DiscereNow

[English](USER-MANUAL.md) · **Português (Brasil)**

## 1. O que é o DiscereNow

O DiscereNow transforma um documento estruturado no Microsoft Word em um curso digital navegável. O fluxo combina duas ferramentas:

- **DiscereNow Add-in**, dentro do Word, para marcar capítulos, lições e blocos educacionais;
- **DiscereNow Studio**, aplicativo desktop, para interpretar o `.docx`, revisar temas e exportar o curso.

```text
Word + Add-in → DOCX estruturado → Studio → pacote Web ou SCORM
```

O Word continua sendo o ambiente de autoria. A marcação feita pelo add-in informa ao Studio o papel de cada conteúdo sem exigir que o autor escreva código.

> **PLACEHOLDER DE PRINT — Visão geral do pipeline**
>
> Substitua este bloco por um diagrama com quatro etapas: documento no Word, painel do add-in, revisão no Studio e curso publicado. Legenda sugerida: “Da autoria no Word à publicação Web ou LMS”.

## 2. Uma história breve

O projeto começou em 2025 pelo runtime React que hoje vive em `template/`. Os snapshots manuais preservados mostram uma evolução rápida: navegação e progresso em abril; botões Continuar, persistência e integração SCORM no início de maio; `suspend_data`, compatibilidade Web/SCORM e refinamentos mobile até meados de maio.

Em abril de 2026, o add-in e o Studio passaram a formalizar o pipeline de autoria: o add-in ganhou blocos semânticos e o Studio passou a converter o DOCX em arquivos de curso. Em julho de 2026, o conjunto foi consolidado com novos blocos, revisão visual, exportação Web/SCORM e numeração automática de capítulos e lições.

| Período | Marco |
| --- | --- |
| abr.–mai. 2025 | Protótipo do curso: navegação, progresso, Continue, SCORM, `suspend_data`, Web e mobile |
| abr. 2026 | Estruturação do add-in e do aplicativo Studio |
| mai. 2026 | Preservação de formatação e refinamentos de experiência no add-in |
| jul. 2026 | Expansão dos blocos, temas, pipeline de exportação e estrutura numerada |

**Status atual:** pipeline funcional para autoria no Word, revisão no Studio e exportação como Web, SCORM 1.2 ou SCORM 2004.

## 3. Antes de começar

Você precisará de:

1. Microsoft Word compatível com suplementos Office;
2. o instalador mais recente do add-in, disponível em [DiscereNow Add-in — Releases](https://github.com/jonathatbusiness/discerenow-addin/releases);
3. DiscereNow Studio instalado;
4. [Node.js](https://nodejs.org/) com `npm`, usado pelo Studio para montar os pacotes;
5. uma pasta onde salvar o DOCX, as imagens e os ZIPs exportados.

### Instalar o add-in

1. Feche o Word.
2. Baixe o instalador na página de releases.
3. Execute o instalador e conclua as instruções apresentadas.
4. Abra novamente o Word.
5. Na faixa de opções, abra o DiscereNow e confirme que o painel lateral aparece.

> **PLACEHOLDER DE PRINT — Download do add-in**
>
> Mostrar a release mais recente no GitHub e destacar o arquivo do instalador.

> **PLACEHOLDER DE PRINT — Add-in aberto no Word**
>
> Mostrar o botão do DiscereNow na faixa de opções e o painel lateral aberto. Identificar o seletor de idioma e as seções recolhíveis.

### Confirmar o Studio

Ao abrir o Studio, aguarde a verificação do `npm`. Se ele não for encontrado, instale o Node.js, feche e abra novamente o aplicativo.

> **PLACEHOLDER DE PRINT — npm detectado**
>
> Mostrar o aviso superior do Studio com a versão do npm e a indicação de que o computador está pronto.

## 4. Entenda a estrutura do curso

A estrutura recomendada é:

```text
Capítulo 1
  Lição 1.1
    bloco
    bloco
  Lição 1.2
    bloco
Capítulo 2
  Lição 2.1
    bloco
```

- Um **Capítulo** agrupa lições.
- Uma **Lição** agrupa os blocos que aparecem depois dela, até a próxima lição ou capítulo.
- Um **Bloco** é uma unidade de conteúdo, como parágrafo, imagem, acordeão ou quiz.

A numeração exibida no Word é uma lista multinível automática. Ela não faz parte do texto do título e, por isso, não aparece duplicada no curso.

É possível trabalhar sem separar o curso manualmente em capítulos: se a primeira marcação estrutural for uma lição, ela será apresentada como `1.1`, e o Studio criará internamente o primeiro capítulo.

> **Importante:** sempre coloque uma lição antes dos blocos. Conteúdo entre um capítulo e sua primeira lição não será incluído em uma lição.

## 5. Autoria no Word

### 5.1 Criar capítulos e lições

Há duas formas de marcar um título:

- **Título já escrito:** selecione ou posicione o cursor no parágrafo e clique em **Capítulo** ou **Lição**.
- **Cursor vazio:** clique em **Capítulo** ou **Lição** e substitua o texto de exemplo.

O add-in aplica estilos `DN-*`, organiza a numeração e mantém capítulos e lições fora dos controles dos blocos.

> **PLACEHOLDER DE PRINT — Capítulos e lições numerados**
>
> Mostrar `1. Nome do capítulo`, `1.1 Nome da lição`, `1.2 ...`, `2. ...` e `2.1 ...` no Word. Destacar que os números são automáticos.

### 5.2 Inserir e editar blocos

Posicione o cursor no local desejado e escolha um bloco no painel. O add-in cria uma área delimitada no Word. Edite os textos de exemplo dentro dessa área, sem remover deliberadamente sua estrutura.

| Seção | Bloco | Como preencher |
| --- | --- | --- |
| Texto | Parágrafo | Selecione texto existente ou insira o bloco e escreva normalmente. A formatação básica do Word é preservada. |
| Texto | Parágrafo com título/subtítulo | Preencha a chamada inicial e o corpo do parágrafo. |
| Texto | Título / Subtítulo | Use para hierarquia visual dentro da lição; não substitui Capítulo ou Lição. |
| Texto | Colunas | Escreva um conteúdo em cada coluna criada. |
| Texto | Tabela | Substitua cabeçalhos e células. Adicione ou remova linhas/colunas com cuidado para manter uma tabela regular. |
| Texto | Callout | Edite o tipo (`info` por padrão), o título e o conteúdo do destaque. |
| Listas | Numerada / Verificação / Marcadores | Substitua os itens e use a ação de adicionar item com o cursor dentro da lista. |
| Mídia | Vídeo | Cole a URL do YouTube na primeira linha e, se desejar, escreva uma legenda. |
| Imagem | Imagem + texto | Substitua o marcador da primeira célula por uma imagem e escreva o texto na segunda. |
| Imagem | Imagem centralizada | Substitua o marcador pela imagem e use a segunda linha para uma legenda opcional. |
| Interação | Acordeão | Preencha título e conteúdo; use **Adicionar item** com o cursor dentro do acordeão. |
| Interação | Abas | Preencha título e conteúdo de cada aba; adicione abas pelo painel. |
| Interação | Cards | Preencha título, conteúdo e imagem opcional de cada card. |
| Interação | Processo | Preencha passo, título opcional, imagem opcional e texto; adicione etapas pelo painel. |
| Interação | Flip Card | Preencha frente e verso; imagens são opcionais. |
| Avaliação | Quiz | Escreva pergunta, opções e feedbacks; defina resposta única ou múltipla e marque as opções corretas pelo painel. |
| Navegação | Continuar | Edite o rótulo se necessário. O botão controla revelação progressiva; o último Continue da lição conduz à próxima lição. |

Nos blocos com imagem opcional, substitua o texto de orientação por uma imagem. Quando o próprio marcador instruir, mantenha apenas `N` para indicar que não haverá imagem.

> **PLACEHOLDER DE PRINT — Anatomia de um bloco**
>
> Mostrar um bloco de acordeão ou cards no Word. Identificar: limite do controle, título, conteúdo, célula de imagem e posição correta do cursor para adicionar item.

> **PLACEHOLDER DE PRINT — Configuração de quiz**
>
> Mostrar a seleção do tipo de quiz e uma opção marcada como correta. A legenda deve lembrar que quizzes de múltipla resposta podem ter mais de uma opção correta.

### 5.3 Regras que evitam problemas

- Não coloque um bloco dentro de outro. O add-in tenta impedir aninhamentos e inserir o novo bloco depois do atual.
- Não altere manualmente os nomes dos estilos `DN-*`.
- Não digite `1.`, `1.1` etc. nos títulos; deixe a lista automática cuidar disso.
- Não use um Título interno como substituto de Capítulo ou Lição.
- Insira imagens dentro dos espaços indicados, não soltas fora do bloco.
- Para adicionar itens a acordeões, abas, cards, listas, processos ou quizzes, deixe o cursor dentro do bloco correspondente.
- Salve como `.docx`; o Studio não recebe `.doc`, PDF ou documento aberto sem salvar.

### 5.4 Checklist antes de sair do Word

- [ ] Cada bloco está abaixo de uma lição.
- [ ] Capítulos e lições estão na ordem correta.
- [ ] Os textos de exemplo foram substituídos.
- [ ] Imagens estão nos campos indicados.
- [ ] Quiz tem tipo e resposta(s) correta(s).
- [ ] Botões Continuar estão onde a revelação deve ocorrer.
- [ ] O arquivo foi salvo como `.docx`.

## 6. Gerar o curso no Studio

O Studio conduz a geração em três etapas.

### Etapa 1 — Informações

1. Informe o **Nome do curso** — é o único campo de metadados obrigatório.
2. Preencha descrição curta, introdução e palavras-chave, se desejar.
3. Na introdução, use uma linha para cada parágrafo.
4. Separe palavras-chave por vírgulas.
5. Selecione uma imagem de capa opcional (`png`, `jpg`, `jpeg`, `webp` ou `gif`).
6. Escolha SCORM 1.2 ou SCORM 2004.
7. Escolha o modo de conclusão:
   - **Ao completar:** concluir todas as lições também registra sucesso;
   - **Por pontuação:** o runtime usa 60% da pontuação máxima quando uma nota está disponível;
   - **Nenhum:** registra conclusão sem declarar aprovação/reprovação separadamente.
8. Selecione o `.docx` criado no Word.
9. Clique em **Avançar para revisão**.

> **PLACEHOLDER DE PRINT — Etapa Informações**
>
> Mostrar o formulário completo, destacando Nome do curso, capa, versão SCORM, modo de conclusão e seleção do DOCX.

### Etapa 2 — Revisão

Confira se todos os capítulos, lições e blocos foram reconhecidos. Essa tela é a oportunidade de detectar uma marcação incorreta antes da exportação.

Você pode:

- escolher o tema visual geral do curso;
- aplicar um tema de bloco a todos os blocos;
- aplicar um tema a uma lição inteira;
- ajustar cada bloco individualmente.

O **Tema padrão** remove uma substituição específica e devolve ao bloco seu comportamento visual normal.

> **PLACEHOLDER DE PRINT — Revisão no Studio**
>
> Mostrar dois capítulos, uma lição expandida e os seletores de tema global, por lição e por bloco.

Se algo estiver ausente ou no lugar errado, volte ao Word, corrija e salve o DOCX. Depois retorne à etapa Informações, selecione novamente o arquivo e refaça a leitura.

### Etapa 3 — Exportação

- **Exportar SCORM:** gera um ZIP para envio a um LMS.
- **Exportar Web:** gera um ZIP com o site estático para hospedagem.

Escolha o nome e o local do arquivo, aguarde a geração e use **Abrir local do arquivo** ao finalizar. Na primeira exportação, a instalação das dependências do template pode levar mais tempo.

> **PLACEHOLDER DE PRINT — Exportação concluída**
>
> Mostrar a confirmação verde, o caminho do ZIP e o botão “Abrir local do arquivo”.

## 7. Publicar e validar

### SCORM

1. Envie o ZIP diretamente ao recurso de importação SCORM do LMS; não descompacte, salvo se o LMS instruir o contrário.
2. Confirme a versão aceita pelo LMS antes de escolher 1.2 ou 2004.
3. Faça um teste como aluno.
4. Verifique abertura, navegação, retomada, porcentagem, conclusão e pontuação.

### Web

1. Descompacte o ZIP.
2. Publique todo o conteúdo em um servidor web ou hospedagem estática.
3. Abra o `index.html` pelo endereço publicado.

O pacote usa caminhos relativos e navegação por hash, facilitando a hospedagem em subpastas. Ainda assim, valide no ambiente de destino.

## 8. Solução de problemas

| Sintoma | O que verificar |
| --- | --- |
| **Avançar para revisão** está desabilitado | Nome do curso, DOCX selecionado e npm detectado são obrigatórios. |
| Lição vazia ou bloco ausente | Confirme se o bloco está depois de uma Lição e se foi criado/marcado pelo add-in. |
| Conteúdo foi para a lição errada | A associação segue a ordem do documento; reposicione a Lição antes dos blocos corretos. |
| Numeração de títulos parece incorreta | Clique novamente em Capítulo ou Lição para reconstruir a lista estrutural; não digite números manualmente. |
| Não consigo adicionar item | Posicione o cursor dentro do bloco antes de usar **Adicionar item**. |
| Imagem não aparece | Confirme se a imagem substituiu o marcador dentro da célula correta. |
| npm não encontrado | Instale Node.js e reinicie o Studio. Em ambientes corporativos, confirme o acesso ao executável `npm`. |
| Primeira exportação demora | O Studio pode estar instalando as dependências internas do template. Acompanhe o log. |
| Pacote funciona na Web, mas não no LMS | Confira versão SCORM, regras de conclusão e restrições do LMS; teste o mesmo ZIP em um ambiente SCORM de referência. |
| Progresso não é retomado | Verifique se o LMS permite e preserva `suspend_data` e se o curso foi reaberto na mesma tentativa. |

## 9. Fluxo rápido de referência

1. Abra o Word e o add-in.
2. Marque capítulos e lições.
3. Insira e preencha os blocos.
4. Salve o `.docx`.
5. Abra o Studio e preencha os metadados.
6. Selecione o DOCX.
7. Revise estrutura e temas.
8. Exporte Web ou SCORM.
9. Teste no ambiente final.

## 10. Links

- [Add-in e releases](https://github.com/jonathatbusiness/discerenow-addin)
- [Site DiscereNow](https://discerenow.vercel.app/)
- [README do Studio em português](README.pt-BR.md)

