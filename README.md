# Tabbycat

A local-first guitar songbook for plain-text tabs, chords, lyrics, transposition, stage mode, and auto-scroll.

## Workflow

1. Export or AirDrop a plain-text tab/chord sheet to your Mac.
2. Open Tabbycat and import/drop the `.txt` file, or point Folder Watch at Downloads.
3. Confirm title, artist, key, and capo.
4. Use Stage Mode, transposition, font sizing, and auto-scroll while you play.

## Principles

- Plain guitarist text is the native format; no ChordPro conversion is required.
- Imported songs stay local unless you explicitly export a JSON backup.
- Folder Watch only reads the folder you explicitly grant access to.
- Guitar tab blocks are preserved; recognized chord-only lines can be transposed.
- Desktop packaging must not remove working web features.

## Web build

The current web version remains a static app. Open `index.html` directly or deploy the repository to a static host such as Vercel.

## Desktop build

The desktop candidate uses Tauri 2 and the same canonical HTML/CSS/JS frontend.

The desktop wrapper adds native folder selection, persisted read-only folder permission, and native filesystem watching. Node and Rust are development/build dependencies only; an end user receives a normal `.app`/DMG and does not run project commands.

Developer setup and the release checklist are in [`DEVELOPMENT.md`](DEVELOPMENT.md).

### Developer commands

```bash
npm install
npm run desktop:check
npm run desktop:dev
npm run desktop:build
```

`desktop-dist/` and Rust build output are generated and are not source-of-truth files.
