# DiscereNow Studio v1.4.0 — Smarter Authoring, Export Feedback, and Update Notifications

🌐 **Language / Idioma:**  
Português Brasileiro · English

---

## Português Brasileiro

### Autoria mais clara, exportação acompanhável e atualização integrada

Esta atualização melhora o fluxo completo entre o documento Word, a revisão no Studio e o curso publicado.

A versão 1.4.0 torna a escolha de temas mais visual, substitui o log técnico da exportação por uma experiência de progresso clara, adiciona avisos de novas versões do aplicativo e corrige casos importantes de interpretação e apresentação do conteúdo DOCX.

### Seleção visual de temas

Os seletores de tema do passo de revisão agora mostram as cores que compõem cada paleta antes do nome.

O novo seletor aparece em:

- tema visual do curso;
- aplicação de tema para todos os blocos;
- aplicação por lição;
- seleção individual por bloco.

Ao aplicar um tema para todos, o tema escolhido permanece visível como selecionado. Caso um bloco ou uma lição seja alterado depois, o estado global é limpo para representar corretamente a configuração atual.

### Progresso de exportação

O quadro técnico escuro exibido durante a exportação foi substituído por:

- barra visual de progresso;
- percentual concluído;
- mensagem curta com a etapa atual;
- transições suaves durante o empacotamento.

O log completo continua disponível após a conclusão para diagnóstico, enquanto a mensagem de sucesso e o caminho do pacote permanecem inalterados.

### Avisos de novas versões

O Studio agora exibe sua versão no cabeçalho e consulta a release pública mais recente ao iniciar.

Quando existe uma versão superior:

- um selo “Nova versão” aparece no cabeçalho;
- um painel informa a versão instalada e a versão disponível;
- o nome e a data da release são exibidos;
- o botão de download abre a página oficial de releases do DiscereNow Studio.

A verificação falha silenciosamente quando não há conexão e nunca baixa ou executa instaladores automaticamente.

### Parser DOCX mais fiel

O parser agora interpreta formatação herdada dos estilos do Word, além da formatação aplicada diretamente aos trechos de texto.

Foram aprimorados:

- negrito, itálico e sublinhado herdados de estilos;
- overrides explícitos de formatação do Word;
- quebras de linha fora das tags de formatação;
- compatibilidade com o novo bloco de vídeo em tabela;
- leitura correta da URL e da legenda do vídeo;
- exclusão de rótulos e placeholders da legenda publicada;
- preservação dos títulos da frente e do verso dos FlipCards;
- tratamento de parágrafos vazios inseridos automaticamente pelo Word.

### Parágrafos e quebras editoriais

Quebras internas de parágrafo agora são convertidas em parágrafos reais no HTML, com espaçamento consistente nos diferentes blocos de texto rico.

Também foram alinhados:

- largura mobile de parágrafos, headings e subheadings;
- espaçamento entre heading/subheading e o parágrafo seguinte;
- espaçamento interno de parágrafos isolados;
- distância entre parágrafos consecutivos;
- altura de linha entre blocos combinados e isolados.

### Animações e layout das lições

As entradas dos blocos agora usam fade puro, sem movimento vertical nem zoom, com duração maior para uma transição mais fluida.

Também foram refinados o comportamento da área de lições, da sidebar e do footer em diferentes larguras e alturas de viewport.

### Resultado

O DiscereNow Studio 1.4.0 oferece uma revisão visual mais clara, feedback de exportação mais amigável e maior fidelidade ao conteúdo estruturado no Word.

A atualização reduz ambiguidades na escolha de temas, corrige perdas de títulos e formatação, melhora os espaçamentos editoriais e cria um caminho seguro para informar novas versões aos usuários.

---

## English

### Clearer authoring, visible export progress, and integrated update notifications

This update improves the complete workflow between the Word document, Studio review, and the published course.

Version 1.4.0 makes theme selection more visual, replaces the technical export log with clear progress feedback, adds application update notifications, and fixes important DOCX interpretation and presentation cases.

### Visual theme selection

Theme selectors in the review step now display the colors that make up each palette before its name.

The new selector is available for:

- the course visual theme;
- applying a theme to all blocks;
- applying a theme by lesson;
- selecting a theme for an individual block.

When a theme is applied to all blocks, it remains visibly selected. If a lesson or block is changed afterward, the global state is cleared to accurately represent the current configuration.

### Export progress

The dark technical output shown during export has been replaced with:

- a visual progress bar;
- completion percentage;
- a short message for the current stage;
- smooth transitions during packaging.

The complete generation log remains available after completion for diagnostics, while the success message and generated package path remain unchanged.

### New version notifications

Studio now displays its current version in the header and checks the latest public release when it starts.

When a newer version is available:

- a “New version” badge appears in the header;
- a panel displays the installed and available versions;
- the release name and publication date are shown;
- the download button opens the official DiscereNow Studio releases page.

The check fails silently when offline and never downloads or runs installers automatically.

### More faithful DOCX parsing

The parser now resolves formatting inherited from Word styles in addition to formatting applied directly to text runs.

Improvements include:

- bold, italic, and underline inherited from styles;
- explicit Word formatting overrides;
- line breaks kept outside formatting tags;
- compatibility with the new table-based video block;
- correct video URL and caption extraction;
- instructional labels and caption placeholders excluded from published output;
- front and back FlipCard titles preserved;
- empty paragraphs automatically inserted by Word handled safely.

### Paragraphs and editorial spacing

Internal paragraph breaks are now converted into real HTML paragraphs with consistent spacing across rich-text blocks.

The release also aligns:

- mobile width across paragraphs, headings, and subheadings;
- spacing between a heading/subheading and its following paragraph;
- internal spacing for standalone paragraph blocks;
- spacing between consecutive paragraphs;
- line height across combined and standalone text blocks.

### Lesson animation and layout

Block entry now uses a pure fade without vertical movement or zoom, with a longer duration for a smoother transition.

Lesson area, sidebar, and footer behavior were also refined across viewport widths and heights.

### Result

DiscereNow Studio 1.4.0 provides clearer visual review, friendlier export feedback, and greater fidelity to content structured in Word.

This update reduces ambiguity during theme selection, fixes missing titles and formatting, improves editorial spacing, and introduces a safe way to notify users about new versions.
