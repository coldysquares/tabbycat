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
- Folder Watch only reads locations permitted to the app.
- Guitar tab blocks are preserved; recognized chord-only lines can be transposed.
- Packaging work must preserve accepted product behavior rather than quietly redesigning the app.

## Web build

Tabbycat remains usable as a static web app.

```sh
npm install
npm run dev
```

The browser build keeps the existing File System Access API Folder Watch when the browser supports it.

## Desktop build

The Mac desktop edition uses Tauri 2. Normal users should open `Tabbycat.app`; Node, Rust, npm commands and Tauri are development concerns only.

For development:

```sh
npm install
npm run desktop:dev
```

To create a local `.app` / DMG candidate on macOS:

```sh
npm run desktop:build
```

The desktop build replaces the browser Folder Watch workaround with a native folder picker and filesystem watcher while keeping the same TXT import pipeline.

See `DEVELOPMENT.md` for the repeatable development/release process and `ACCEPTANCE.md` for the pre-release checklist.

## Desktop v0.2 migration rule

The first desktop packaging pass deliberately preserves the existing song store and JSON backup/import contract. Moving canonical song persistence to explicit Tauri app-data storage is a later migration and must include backup, verification and rollback protection rather than silently replacing existing data.
