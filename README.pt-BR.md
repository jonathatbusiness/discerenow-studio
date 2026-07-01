<div align="center">

[English](README.md) · **Português (Brasil)**

# DiscereNow Studio

Transforme documentos estruturados do Microsoft Word em cursos digitais prontos para Web e SCORM.

[Site](https://discerenow.vercel.app/) · [Add-in do Word](https://github.com/jonathatbusiness/discerenow-addin)

</div>

## Visão geral

O DiscereNow Studio é uma aplicação desktop para produção de cursos, construída com Electron, React e TypeScript. Ele utiliza o Microsoft Word como ambiente visual de autoria, permitindo que Designers Instrucionais trabalhem em uma ferramenta conhecida em vez de aprenderem um editor proprietário.

O add-in DiscereNow para Word adiciona uma camada semântica ao documento por meio de estilos e controles de conteúdo `DN-*`. O Studio interpreta essa estrutura, converte o conteúdo em blocos educacionais reutilizáveis, aplica temas ao curso e aos blocos e exporta o resultado para Web ou para um LMS.

```text
Word + add-in DiscereNow → DOCX estruturado → DiscereNow Studio → Web ou SCORM
```

## Blocos educacionais disponíveis

- Parágrafos
- Imagem e texto
- Vídeos
- Callouts
- Acordeões
- Abas
- Cards
- Flip cards
- Quizzes de resposta única ou múltipla
- Botões Continuar para revelação progressiva e navegação entre lições

## Formatos de exportação

- Pacote Web
- SCORM 1.2
- SCORM 2004

O runtime do curso oferece acompanhamento de progresso, status de conclusão, marcadores, notas, interações e restauração do progresso por `suspend_data`, quando disponíveis na versão SCORM selecionada.

## Arquitetura

```text
src/
├── main/
│   ├── parser/       Leitura do DOCX e geração dos dados do curso
│   └── runner/       Pipeline de build e exportação Web/SCORM
├── preload/          Ponte tipada entre o Electron e a interface
└── renderer/         Interface do Studio em três etapas

template/
├── src/core/blocks/  Componentes dos blocos do curso
├── src/launcher/     Runtime e inicializador SCORM
├── src/theme/        Temas do curso e dos blocos
└── scripts/          Build do template e empacotamento SCORM
```

O diretório `addin/` pode existir localmente para trabalhos de integração, mas pertence a outro projeto e é intencionalmente ignorado por este repositório.

## Requisitos

- Node.js com npm
- Microsoft Word e o add-in DiscereNow para criar documentos estruturados

## Desenvolvimento

```bash
npm install
npm run dev
```

Execute as validações:

```bash
npm run typecheck
npm run lint
```

## Builds da aplicação

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

Use `npm run build:unpack` para criar uma versão descompactada da aplicação.

## Backups locais

Antes de mudanças relevantes, crie um snapshot local:

```powershell
npm run backup -- motivo-curto
```

Os snapshots são gravados como arquivos ZIP individuais em `.bk/`. Esse diretório é sincronizado pelo provedor de armazenamento local, quando aplicável, e ignorado pelo Git. Os backups complementam o histórico do Git; eles não substituem commits, branches ou tags.

## Autor

Arquitetura e design do produto por [Jonatha Teixeira](https://discerenow.vercel.app/).
