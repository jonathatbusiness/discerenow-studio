# DiscereNow User Manual

**English** · [Português (Brasil)](USER-MANUAL.pt-BR.md)

## 1. What DiscereNow is

DiscereNow turns a structured Microsoft Word document into a navigable digital course. The workflow combines:

- the **DiscereNow Add-in** in Word, used to mark chapters, lessons, and learning blocks;
- **DiscereNow Studio**, a desktop application that reads the `.docx`, reviews themes, and exports the course.

```text
Word + Add-in → structured DOCX → Studio → Web or SCORM package
```

Word remains the authoring environment. The add-in gives content semantic meaning through visual actions, so authors do not need to write code.

> **SCREENSHOT PLACEHOLDER — Pipeline overview**
>
> Replace this block with a four-stage diagram: Word document, add-in task pane, Studio review, and published course. Suggested caption: “From Word authoring to Web or LMS delivery.”

## 2. A brief history

The project began in 2025 with the React course runtime now found in `template/`. Preserved manual snapshots show navigation and progress work in April; Continue behavior, persistence, and SCORM integration in early May; and `suspend_data`, Web/SCORM compatibility, and mobile refinements by mid-May.

In April 2026, the add-in and Studio formalized the authoring pipeline. The add-in introduced semantic learning blocks, while Studio converted DOCX content into course files. By July 2026, the product had consolidated new block types, visual review, Web/SCORM export, and automatic chapter/lesson numbering.

| Period | Milestone |
| --- | --- |
| Apr–May 2025 | Course prototype: navigation, progress, Continue, SCORM, `suspend_data`, Web, and mobile |
| Apr 2026 | Add-in and Studio application established |
| May 2026 | Formatting preservation and add-in UX refinements |
| Jul 2026 | Expanded blocks, themes, export pipeline, and numbered structure |

**Current status:** a functional pipeline for Word authoring, Studio review, and Web, SCORM 1.2, or SCORM 2004 export.

## 3. Before you begin

You need:

1. Microsoft Word with Office Add-in support;
2. the latest add-in installer from [DiscereNow Add-in — Releases](https://github.com/jonathatbusiness/discerenow-addin/releases);
3. DiscereNow Studio installed;
4. [Node.js](https://nodejs.org/) with `npm`, which Studio uses to build packages;
5. a working folder for the DOCX, images, and exported ZIP files.

### Install the add-in

1. Close Word.
2. Download the installer from the releases page.
3. Run it and follow the displayed instructions.
4. Reopen Word.
5. Open DiscereNow from the ribbon and confirm that the task pane appears.

> **SCREENSHOT PLACEHOLDER — Add-in download**
>
> Show the latest GitHub release and highlight the installer asset.

> **SCREENSHOT PLACEHOLDER — Add-in open in Word**
>
> Show the DiscereNow ribbon button and open task pane. Identify the language selector and collapsible sections.

### Check Studio

When Studio opens, wait for its `npm` check. If npm is missing, install Node.js, close Studio, and open it again.

> **SCREENSHOT PLACEHOLDER — npm detected**
>
> Show Studio's top notice with the npm version and ready state.

## 4. Understand course structure

The recommended structure is:

```text
Chapter 1
  Lesson 1.1
    block
    block
  Lesson 1.2
    block
Chapter 2
  Lesson 2.1
    block
```

- A **Chapter** groups lessons.
- A **Lesson** owns the blocks that follow it, up to the next lesson or chapter.
- A **Block** is a content unit such as a paragraph, image, accordion, or quiz.

Numbers displayed in Word are automatic multilevel-list markers. They are not part of the title text and will not be duplicated in the generated course.

Chapters are optional for the authoring workflow. If the first structural marker is a lesson, Word displays it as `1.1`, and Studio creates the first chapter internally.

> **Important:** always place a lesson before its blocks. Content between a chapter and its first lesson is not assigned to a lesson.

## 5. Author in Word

### 5.1 Create chapters and lessons

You can mark structure in two ways:

- **Text already exists:** select or place the cursor in the paragraph, then click **Chapter** or **Lesson**.
- **Empty cursor position:** click **Chapter** or **Lesson**, then replace the sample text.

The add-in applies `DN-*` styles, maintains numbering, and keeps structural titles outside learning-block controls.

> **SCREENSHOT PLACEHOLDER — Numbered chapters and lessons**
>
> Show `1. Chapter name`, `1.1 Lesson name`, `1.2 ...`, `2. ...`, and `2.1 ...` in Word. Highlight that numbering is automatic.

### 5.2 Insert and edit blocks

Place the cursor where content should appear and choose a block in the task pane. The add-in creates a bounded area in Word. Replace the sample content inside it without deliberately removing its structure.

| Section | Block | How to complete it |
| --- | --- | --- |
| Text | Paragraph | Select existing text or insert the block and type normally. Basic Word formatting is preserved. |
| Text | Paragraph with heading/subheading | Complete the lead heading and paragraph body. |
| Text | Heading / Subheading | Use for hierarchy inside a lesson; these do not replace Chapter or Lesson. |
| Text | Columns | Enter content in each generated column. |
| Text | Table | Replace headers and cells. Keep the table rectangular when adding or removing rows or columns. |
| Text | Callout | Edit its type (`info` by default), title, and content. |
| Lists | Numbered / Checkbox / Bullet | Replace items; use the add-item action while the cursor is inside the list. |
| Media | Video | Paste a YouTube URL on the first line and optionally add a caption. |
| Image | Image + text | Replace the first-cell marker with an image and enter text in the second cell. |
| Image | Centered image | Replace the marker with an image and use the second row for an optional caption. |
| Interaction | Accordion | Complete title and content; use **Add item** with the cursor inside the accordion. |
| Interaction | Tabs | Complete each tab's title and content; add tabs from the task pane. |
| Interaction | Cards | Complete each card's title, content, and optional image. |
| Interaction | Process | Complete step, optional title, optional image, and text; add steps from the task pane. |
| Interaction | Flip Card | Complete front and back; images are optional. |
| Assessment | Quiz | Enter question, options, and feedback; choose single or multiple answers and mark correct options in the task pane. |
| Navigation | Continue | Edit the label if needed. Continue controls progressive reveal; the last Continue in a lesson goes to the next lesson. |

For optional images, replace the instruction text with an image. Where the marker explicitly says so, leave only `N` to indicate no image.

> **SCREENSHOT PLACEHOLDER — Block anatomy**
>
> Show an accordion or cards block in Word. Identify the content-control boundary, title, content, image cell, and correct cursor position for adding an item.

> **SCREENSHOT PLACEHOLDER — Quiz setup**
>
> Show quiz-type selection and a correct option. The caption should note that multiple-answer quizzes may have more than one correct option.

### 5.3 Rules that prevent problems

- Do not place one block inside another. The add-in guards against nesting and normally inserts after the current block.
- Do not manually rename `DN-*` styles.
- Do not type `1.`, `1.1`, and similar prefixes; let automatic numbering handle them.
- Do not use an internal Heading in place of Chapter or Lesson.
- Insert images in the indicated fields, not loose outside the block.
- To add accordion items, tabs, cards, list items, process steps, or quiz options, keep the cursor inside that block.
- Save as `.docx`; Studio does not accept `.doc`, PDF, or an unsaved document.

### 5.4 Word checklist

- [ ] Every block is below a lesson.
- [ ] Chapters and lessons are in the intended order.
- [ ] Sample text has been replaced.
- [ ] Images are inside the indicated fields.
- [ ] Quizzes have a type and correct answer(s).
- [ ] Continue buttons are where progressive reveals should occur.
- [ ] The file is saved as `.docx`.

## 6. Generate the course in Studio

Studio uses a three-step workflow.

### Step 1 — Information

1. Enter the **Course name** — the only required metadata field.
2. Optionally add a short description, introduction, and keywords.
3. Use one line per introduction paragraph.
4. Separate keywords with commas.
5. Select an optional cover image (`png`, `jpg`, `jpeg`, `webp`, or `gif`).
6. Choose SCORM 1.2 or SCORM 2004.
7. Choose a completion mode:
   - **On complete:** completing all lessons also records success;
   - **On score:** the runtime uses 60% of the maximum score when a score is available;
   - **None:** records completion without separately declaring pass/fail.
8. Select the Word `.docx`.
9. Click **Go to review**.

> **SCREENSHOT PLACEHOLDER — Information step**
>
> Show the completed form and highlight Course name, cover, SCORM version, completion mode, and DOCX selection.

### Step 2 — Review

Confirm that Studio recognized every chapter, lesson, and block. This is where you catch authoring mistakes before export.

You can:

- choose the overall course visual theme;
- apply a block theme to every block;
- apply a theme to an entire lesson;
- adjust individual blocks.

**Default theme** removes a specific override and restores the block's normal visual behavior.

> **SCREENSHOT PLACEHOLDER — Studio review**
>
> Show two chapters, one expanded lesson, and global, per-lesson, and per-block theme selectors.

If something is missing or misplaced, correct and save it in Word. Return to Information, select the file again, and parse it again.

### Step 3 — Export

- **Export SCORM:** creates a ZIP for an LMS.
- **Export Web:** creates a static-site ZIP for hosting.

Choose a filename and destination, wait for packaging, then use **Open file location**. The first export may take longer while internal template dependencies are installed.

> **SCREENSHOT PLACEHOLDER — Successful export**
>
> Show the green success notice, ZIP path, and “Open file location” button.

## 7. Publish and validate

### SCORM

1. Upload the ZIP directly through the LMS's SCORM import feature; do not extract it unless the LMS says otherwise.
2. Confirm whether the LMS expects SCORM 1.2 or 2004.
3. Launch a learner test.
4. Verify launch, navigation, resume, percentage, completion, and score.

### Web

1. Extract the ZIP.
2. Upload all contents to a web server or static host.
3. Open `index.html` through its published URL.

The package uses relative paths and hash routing, which makes subfolder hosting easier. Always validate in the target environment.

## 8. Troubleshooting

| Symptom | What to check |
| --- | --- |
| **Go to review** is disabled | Course name, selected DOCX, and detected npm are required. |
| Empty lesson or missing block | Ensure the block follows a Lesson and was created/marked with the add-in. |
| Content belongs to the wrong lesson | Ownership follows document order; move the Lesson marker before the correct blocks. |
| Title numbering looks wrong | Click Chapter or Lesson again to rebuild structural numbering; do not type numbers manually. |
| Cannot add an item | Place the cursor inside the relevant block before clicking **Add item**. |
| Image is missing | Confirm that the image replaced the marker in the correct table cell. |
| npm not found | Install Node.js and restart Studio. In managed environments, confirm access to the `npm` executable. |
| First export is slow | Studio may be installing internal template dependencies. Watch the generation log. |
| Works on Web but not in the LMS | Check SCORM version, completion rules, and LMS restrictions; test the same ZIP in a reference SCORM environment. |
| Progress does not resume | Confirm that the LMS supports and preserves `suspend_data` and that the same attempt was reopened. |

## 9. Quick reference

1. Open Word and the add-in.
2. Mark chapters and lessons.
3. Insert and complete blocks.
4. Save the `.docx`.
5. Open Studio and enter metadata.
6. Select the DOCX.
7. Review structure and themes.
8. Export Web or SCORM.
9. Test in the target environment.

## 10. Links

- [Add-in and releases](https://github.com/jonathatbusiness/discerenow-addin)
- [DiscereNow website](https://discerenow.vercel.app/)
- [Studio README](README.md)

