<div align="center">

**English** · [Português (Brasil)](README.pt-BR.md)

# DiscereNow Studio

Turn structured Microsoft Word documents into web-ready and SCORM-ready digital learning courses.

[Website](https://discerenow.vercel.app/) · [Word Add-in](https://github.com/jonathatbusiness/discerenow-addin)

</div>

## Documentation

- [User Manual](USER-MANUAL.md)
- [Manual do usuário — Português (Brasil)](USER-MANUAL.pt-BR.md)
- [Development Documentation](DEVELOPMENT.md)

## Overview

DiscereNow Studio is a desktop course-production application built with Electron, React, and TypeScript. It uses Microsoft Word as the visual authoring environment, allowing instructional designers to work in a familiar tool instead of learning a proprietary editor.

The DiscereNow Word Add-in applies a semantic layer to the document through `DN-*` styles and content controls. Studio reads that structure, converts it into reusable learning blocks, applies course and block themes, and exports the result for the web or a learning management system.

```text
Word + DiscereNow Add-in → structured DOCX → DiscereNow Studio → Web or SCORM
```

## Supported learning blocks

- Paragraphs
- Headings and subheadings
- Paragraphs with headings or subheadings
- Responsive text columns
- Theme-aware tables
- Numbered, checkbox, and bullet lists
- Image and text
- Centered images with optional captions
- Videos
- Callouts
- Accordions
- Tabs
- Cards
- Process carousels with optional images
- Flip cards
- Single-answer and multiple-answer quizzes
- Continue buttons for progressive reveal and lesson navigation

## Export formats

- Web package
- SCORM 1.2
- SCORM 2004

The course runtime supports progress tracking, completion status, bookmarks, scores, interactions, and progress restoration through `suspend_data` where supported by the selected SCORM version.

## Architecture

```text
src/
├── main/
│   ├── parser/       DOCX parsing and course-data generation
│   └── runner/       Web and SCORM build/export pipeline
├── preload/          Typed bridge between Electron and the UI
└── renderer/         Three-step Studio interface

template/
├── src/core/blocks/  Course block components
├── src/launcher/     SCORM runtime and launcher
├── src/theme/        Course and block themes
└── scripts/          Template build and SCORM packaging
```

The `addin/` directory may exist locally for integration work, but it is a separate project and is intentionally ignored by this repository.

## Requirements

- Node.js with npm
- Microsoft Word and the DiscereNow Add-in for authoring structured documents

## Development

```bash
npm install
npm run dev
```

Run validation:

```bash
npm run typecheck
npm run lint
```

## Application builds

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

Use `npm run build:unpack` to create an unpacked application build.

## Local backups

Before material changes, create a local snapshot:

```powershell
npm run backup -- short-reason
```

Snapshots are written as individual ZIP files in `.bk/`. This directory is synchronized by the local storage provider when applicable and ignored by Git. Backups complement Git history; they do not replace commits, branches, or tags.

## Author

Architecture and product design by [Jonatha Teixeira](https://discerenow.vercel.app/).
