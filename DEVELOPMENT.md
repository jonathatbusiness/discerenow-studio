# DiscereNow Development Documentation

## 1. Purpose and scope

DiscereNow is a document-driven course production pipeline. Instructional designers author in Microsoft Word, the Word add-in encodes semantic structure, Studio parses the DOCX package, and the React runtime delivers the generated course as a static website or a SCORM SCO.

This document records the system history, architecture, contracts, development workflow, and current technical status. End-user instructions belong in [USER-MANUAL.md](USER-MANUAL.md) and [USER-MANUAL.pt-BR.md](USER-MANUAL.pt-BR.md).

## 2. Repository boundaries

The product is maintained as two projects:

- **DiscereNow Studio** — this repository; Electron application, DOCX parser, course writer, build runner, and runtime template.
- **DiscereNow Add-in** — separate repository at [jonathatbusiness/discerenow-addin](https://github.com/jonathatbusiness/discerenow-addin); Office.js task pane and manifest.

The local `addin/` directory is an integration copy only. It is intentionally ignored by Studio's Git repository. Changes made there must be copied to the original add-in repository and committed separately.

## 3. Historical record

### 3.1 Evidence and limitations

The earliest runtime work predates the current Git repositories. Its history is reconstructed from manually named backup folders and screenshots supplied by the project author. Dates below describe preserved milestones, not necessarily exact release dates. From April 2026 onward, repository commits provide a traceable record.

### 3.2 Reconstructed timeline

| Date or period | Development milestone | Evidence |
| --- | --- | --- |
| 28 Apr–2 May 2025 | Initial runtime iterations | Numbered manual snapshots dated 28–29 Apr and 1–2 May |
| 2–7 May 2025 | SCORM API loading, completion-state debugging, navigation visibility, progress calculation | Snapshot names documenting SCORM API, percentage counters, navigation, and completion trials |
| 6–8 May 2025 | Continue-based reveal, scroll behavior, saved reveal position, transition fixes | Snapshot names documenting Continue unlock/hide/save and progress transitions |
| 7–8 May 2025 | SCORM completion stabilized; localStorage working across projects | Snapshots culminating in “conclusão OK finalmente” and multi-project storage |
| 11–12 May 2025 | LMS loading experiments, functional `suspend_data`, cross-browser progress, functional Web and SCORM output | Snapshots documenting failed LMS load, then functional suspend data and Web/SCORM builds |
| 12–15 May 2025 | Mobile refinements and functional beta, including English beta | Final numbered beta snapshots |
| 23 Apr 2026 | Studio and add-in repositories initialized | Git histories |
| 23–29 Apr 2026 | Semantic `DN-*` controls, automatic styles, safe block wrappers, expanded blocks, image-aware structures, quiz controls, command icons, bilingual add-in | Add-in commits |
| 2–6 May 2026 | Add-in visual identity, collapsible sections, formatting preservation, update-log experiments | Add-in commits |
| 1–2 Jul 2026 | Studio cleanup baseline, generated-artifact cleanup, new learning blocks, streamlined review, Studio 1.2.0 | Studio commits |
| 2–3 Jul 2026 | Add-in text actions, lists, centered image, process block, insertion guardrails, automatic chapter/lesson numbering | Add-in commits |

### 3.3 Product evolution

The architecture grew in three layers:

1. **Runtime first (2025):** navigation, progress, Continue gates, persistence, SCORM communication, and responsive course UI.
2. **Semantic authoring (2026):** Office.js controls and styles gave Word content a machine-readable contract.
3. **Production pipeline (2026):** Electron orchestration connected parsing, review, theming, generation, build, packaging, and cleanup.

This ordering explains why `template/` is both the oldest conceptual component and the generated product's runtime foundation.

## 4. System architecture

```text
Microsoft Word
  └─ DiscereNow Add-in
       ├─ applies paragraph styles (DN-Capitulo, DN-Licao, field styles)
       └─ creates tagged content controls (DN-paragraph, DN-quiz, ...)
                 │
                 ▼
             .docx package
                 │
                 ▼
Electron main process
  ├─ docxParser.ts       XML → CourseTree
  ├─ lessonWriter.ts     CourseTree → generated JS + extracted media
  └─ scormRunner.ts      npm build → Web/SCORM ZIP → cleanup
                 │
                 ▼
React template runtime
  ├─ chapters / lessons / blocks
  ├─ themes and responsive UI
  ├─ progress and Continue behavior
  └─ SCORM launcher and suspend_data sync
```

### 4.1 Studio process boundaries

- `src/main/`: privileged Electron code, dialogs, parsing, file generation, child processes, packaging.
- `src/preload/`: typed, narrow IPC bridge exposed as `window.api`.
- `src/renderer/`: three-step React interface: metadata, review, export.
- `template/`: Vite/React application copied into the generated package.

The renderer never performs direct filesystem or process operations. It delegates through preload IPC handlers to the main process.

## 5. The DOCX semantic contract

### 5.1 Structural styles

| Word style | Meaning | Parser behavior |
| --- | --- | --- |
| `DN-Capitulo` | Chapter title | Starts a chapter, closes any open compound block, resets the current lesson |
| `DN-Licao` | Lesson title | Starts a lesson in the current chapter; creates an implicit chapter if none exists |

Structural headings must be outside content controls. Chapter IDs increment globally; lesson IDs restart within each chapter. Automatic Word list markers are numbering metadata and are not returned by the parser's text extraction.

### 5.2 Block tags

| Content-control tag | Generated block |
| --- | --- |
| `DN-paragraph` | Paragraph |
| `DN-paragraphHeading`, `DN-paragraphSubheading` | Paragraph with lead heading/subheading |
| `DN-heading`, `DN-subheading` | Text heading/subheading |
| `DN-columns` | Responsive columns |
| `DN-table` | Data table |
| `DN-numberedList`, `DN-checkboxList`, `DN-bulletList` | Learning lists |
| `DN-imgText`, `DN-imageCentered` | Image/text and centered-image blocks |
| `DN-callout`, `DN-video` | Callout and video |
| `DN-accordion`, `DN-tabs`, `DN-cards`, `DN-process`, `DN-flipcard` | Compound interactions |
| `DN-quiz` | Single- or multiple-answer quiz |
| `DN-continue` | Progressive-reveal/navigation boundary |

Nested field styles such as `DN-Quiz-Pergunta`, `DN-Card-Titulo`, and `DN-Process-Texto` disambiguate roles inside compound controls. Treat tag and style spelling as a public integration contract: changing either side requires coordinated add-in and parser updates.

### 5.3 Ordering semantics

`docxParser.ts` walks paragraphs in document order and maintains `currentChapter`, `currentLesson`, and optional compound-block state. Blocks are appended to the current lesson. Paragraphs encountered before any lesson are skipped. A lesson without a preceding chapter is placed in an implicit chapter named `Untitled chapter`.

At parse completion, the final Continue block in every lesson is marked `isEndOfLesson`; the runtime uses this to navigate rather than merely reveal more content.

### 5.4 Media resolution

The parser records DOCX relationship IDs for supported embedded images. `lessonWriter.ts` resolves those relationships from the ZIP, writes normalized `img-N.ext` files beneath `template/public/img/<courseId>/`, and replaces internal relationship fields with public paths. Internal fields prefixed with `_` are stripped from serialized lesson data.

## 6. Generation and runtime

### 6.1 Course tree and generated files

The normalized tree is:

```ts
type CourseTree = {
  chapters: Array<{
    id: string
    chapterName: string
    lessons: Array<{
      chapterId: string
      lessonId: string
      chapterName: string
      name: string
      blocks: Block[]
    }>
  }>
}
```

Generation writes:

```text
template/src/content/courseData.js
template/src/content/chapters/cap_<chapterId>/lesson_<chapterId>_<lessonId>.jsx
template/public/img/<courseId>/...
```

`Chapters.jsx` discovers lesson modules with `import.meta.glob`, groups them by chapter, and numerically sorts chapters and lessons.

### 6.2 Themes

Studio stores the overall course theme in metadata. Block overrides are keyed by `<chapterId>_<lessonId>` and block index. Overrides can be applied globally, per lesson, or per block before generated files are written.

### 6.3 Web export

The runner ensures template dependencies exist, executes the standard Vite build, injects SEO/social metadata, and archives `template/dist/`. The runtime uses relative assets and `HashRouter`, supporting static hosting in a subdirectory without server-side route rewrites.

### 6.4 SCORM export

The SCORM build creates a single-SCO package with:

- `imsmanifest.xml` for SCORM 1.2 or 2004;
- launcher files that locate and wrap the LMS API;
- the built course beneath `scormcontent/`.

The controller tracks completion, location, progress, score, and interaction data where supported. Progress maps are compressed into `suspend_data`; browser storage supports Web mode and local runtime state.

Completion modes are:

- `onComplete`: course completion records success/passed;
- `onScore`: recorded score is compared with 60% of maximum;
- `none`: completion is reported without a separate success requirement.

SCORM 1.2 combines completion and success in `cmi.core.lesson_status`; SCORM 2004 uses separate completion and success status fields.

### 6.5 Cleanup

After copying the requested output, the runner removes generated course data, lesson directories, course-specific images, build output, SCORM staging, and temporary artifacts. Path guards prevent cleanup from deleting the chosen destination if it is within a generated location.

## 7. Add-in implementation notes

The add-in is a static Office.js task pane hosted through GitHub Pages. It creates paragraph styles on startup and inserts rich-text content controls with stable tags. Compound structures use Word tables because tables provide predictable authoring regions for repeated item fields and images.

Insertion guardrails detect surrounding controls. Structural headings are inserted after a current block; new blocks avoid nesting inside existing block controls; add-item operations require the cursor inside the matching parent control.

Chapter and lesson numbering uses a shared Word multilevel list through WordApi 1.3:

- level 0 format: `1.`;
- level 1 format: `1.1`;
- all structural paragraphs are reattached in document order when structure is marked.

The marker is Word list metadata, so no parser change is required.

Static asset URLs use query-string versions (for example, `taskpane.js?v=1.5.2`) as cache busters. When publishing an add-in update, bump all matching asset and update-log query versions together.

## 8. Development workflow

### 8.1 Requirements

- Node.js and npm
- Microsoft Word for integration testing
- An LMS or SCORM test environment for package validation

### 8.2 Studio setup

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run lint
npm run build
```

Platform builds:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

`npm run build:unpack` produces an unpacked application for local inspection.

### 8.3 Required backups

Before material changes to parser behavior, the `DN-*` contract, generation, SCORM, build configuration, dependencies, or multi-file structure:

```powershell
npm run backup -- short-reason
```

Snapshots are stored as one ZIP each in `.bk/`, synchronized locally, and ignored by Git. Never delete or restore them without explicit authorization.

### 8.4 Coordinated contract changes

For a new block or contract change:

1. define the add-in tag and nested field styles;
2. add creation/edit actions and bilingual UI strings;
3. extend parser block types and state handling;
4. resolve embedded relationships if media is supported;
5. add serialization and review labels/icons;
6. implement the template component and theme behavior;
7. test Word insertion, DOCX parsing, Web export, and both SCORM versions;
8. commit add-in and Studio changes in their respective repositories.

### 8.5 Release hygiene

Studio versions live in `package.json` and package metadata. Add-in UI release information lives in `src/update-log.json`, while static asset cache busting is coordinated in `src/taskpane.html` and `src/taskpane.js`. The Office manifest has its own deployment version and hosted URLs.

Do not rely on `git rm --cached` to invalidate browser or Office webview assets. Query-string version changes are the relevant cache-busting mechanism; a GitHub Pages deployment must also complete successfully.

## 9. Testing strategy

No dedicated automated parser or end-to-end test suite is currently present in this repository. Until one is introduced, use the following regression matrix for material changes:

### Authoring and parsing

- chapter with multiple lessons;
- lesson-only document and implicit chapter;
- multiple chapters with lesson numbering restart;
- every simple block;
- repeated compound items;
- optional image present and absent (`N` marker);
- single- and multiple-answer quizzes;
- multiple Continue boundaries;
- formatting-rich paragraph text;
- non-ASCII content in PT-BR and English.

### Packaging

- Web ZIP opens from static hosting;
- SCORM 1.2 imports, launches, resumes, completes, and reports score;
- SCORM 2004 imports, launches, resumes, completes, and reports success;
- output saved inside and outside common user folders;
- second course export does not retain artifacts from the first;
- first run without `template/node_modules` and later cached runs.

### Add-in

- empty cursor and existing-text structural marking;
- insertion inside and outside a block;
- add-item action in the correct and incorrect context;
- bilingual labels and update panel;
- Word desktop/web compatibility for the required Office.js API set;
- static asset refresh after Pages deployment.

## 10. Current status and known constraints

As of 3 July 2026:

- Studio metadata reports version 1.2.0.
- The integration copy of the add-in reports 1.5.2.
- Web, SCORM 1.2, and SCORM 2004 exports are implemented.
- npm is an external runtime requirement for packaging.
- The parser intentionally trusts the `DN-*` contract and document order; user-facing structural validation is limited.
- Paragraphs before the first lesson are not course blocks.
- The score pass threshold is fixed at 60% in the SCORM controller.
- Git histories do not cover the earliest 2025 runtime work; manual snapshot evidence remains the historical source.
- The add-in and Studio require separate commits and releases.
- LMS behavior varies; exported SCORM packages require target-platform validation.

## 11. Recommended next documentation and engineering work

1. Add representative DOCX fixtures and parser snapshot tests.
2. Add automated validation warnings for orphan blocks, empty lessons, missing quiz answers, and malformed compound blocks.
3. Add a configurable score threshold to Studio metadata.
4. Record tested Word platforms and minimum Office.js requirement sets.
5. Record tested LMS products and SCORM behaviors in a compatibility matrix.
6. Keep screenshots for both user manuals synchronized with UI releases.
7. Tag coordinated Studio/add-in releases and maintain a cross-project compatibility table.

## 12. Key references

- [Studio README](README.md)
- [Studio README — PT-BR](README.pt-BR.md)
- [English User Manual](USER-MANUAL.md)
- [Manual do usuário — PT-BR](USER-MANUAL.pt-BR.md)
- [DiscereNow Add-in repository](https://github.com/jonathatbusiness/discerenow-addin)
- [DiscereNow website](https://discerenow.vercel.app/)

