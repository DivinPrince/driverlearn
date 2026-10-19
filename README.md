<img src="assets/icon.svg" width="64" height="64" alt="">

# DriverLearn

A fun study app for the **Rwanda provisional driving licence theory test** (*uruhushya rw'agateganyo*). It contains the whole
official question bank in Kinyarwanda, with English translations, short explanations and road-sign pictures, and adds practice
modes, mock exams and progress tracking on top.

Built with **Vite + Svelte 5 + TypeScript + Tailwind CSS v4**, run with **Bun**. It works offline once installed (PWA) and keeps
all progress in the browser (`localStorage`); there is no account or server.

## Features

- **Smart practice** — spaced repetition (Leitner boxes). Missed questions come back sooner and are asked again at the end of the
  session. Combos, XP and instant feedback with an explanation for every answer.
- **Learn by topic** — 12 topics (road signs, right of way, speed limits, overtaking, parking, markings, traffic lights, vehicle
  lights, vehicle and loads, safe driving, pedestrians and cyclists, traffic law), each with a mastery ring.
- **Mock exams** in the official format: 20 questions, 20 minutes, pass mark 12/20 (60%). Questions are drawn from every topic in
  proportion. Includes a timer, a question navigator, flags for review and a full review of your answers afterwards.
- **Road signs trainer** — gallery, flip flashcards and a quick sign quiz.
- **All questions** — a searchable reader for the whole bank, with answers and explanations.
- **Progress** — exam readiness score, activity heatmap, exam history, topic mastery, streaks, levels and achievements.
- **Kinyarwanda or English**, with an option to show the other language under each question. Light and dark themes, sound effects,
  keyboard shortcuts (`1`–`4` / `A`–`D` to answer, `Enter` to check and continue).

## Getting started

```sh
bun install
bun run dev        # http://localhost:5173
```

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `bun run dev`     | Start the Vite dev server                        |
| `bun run build`   | Production build into `dist/` (with PWA files)   |
| `bun run preview` | Serve the production build locally               |
| `bun run check`   | Type-check Svelte and TypeScript (`svelte-check`) |
| `bun test`        | Unit tests (learning engine + question bank)     |

## Project layout

```
src/
  App.svelte              app shell: navigation and route switching
  app.css                 design tokens (colours, fonts) and shared component classes
  data/questions.json     the question bank (generated, see below)
  lib/
    engine/               pure learning logic: spaced repetition, question selection, XP/levels/streaks, achievements, stats
    state/                persistent stores (Svelte 5 runes): progress, settings, UI events, mock exam in progress
    components/           shared UI: QuestionCard, QImage, Modal, ProgressRing, Mascot, ...
    data.ts topics.ts i18n.ts router.svelte.ts sound.ts celebrate.ts
  screens/                one component per screen (Home, Learn, Practice, Exam, Signs, Library, Progress, Settings, Onboarding)
public/q/                 question images (WebP) cropped from the PDF
scripts/                  data pipeline
```

## The question bank

`src/data/questions.json` was generated from the official Kinyarwanda question bank PDF:

1. `scripts/pdf/extract.py` reads every text line (correct answers are printed in red in the PDF) and crops every picture.
2. `scripts/pdf/parse.py` groups the lines into questions and options and works out which pictures belong to the question and which
   are answer choices.
3. Each question was then checked against the rendered PDF page, given an English translation, a topic and a short explanation, and
   checked again by a second reviewer.
4. `bun scripts/build-data.ts <dir>` validates and merges the result, removes exact duplicates and numbers the questions.

The red answer in the PDF is always the answer the app uses. Notes about problems in the source (typos, unclear answer keys) are
kept in `scripts/data-flags.json` and are not shipped with the app.

> English translations and explanations are study aids. On exam day the official wording applies.
