# Tabbycat

A local-first guitar songbook for plain-text tabs, chords, lyrics, transposition, stage mode, and auto-scroll.

## Workflow

1. Export or AirDrop a plain-text tab/chord sheet to your Mac.
2. Open Tabbycat and import/drop the `.txt` file, or point Folder Watch at Downloads.
3. Confirm title, artist, key, and capo.
4. Use Stage Mode, transposition, font sizing, and auto-scroll while you play.

## Principles

- Plain guitarist text is the native format; no ChordPro conversion is required.
- Imported songs stay in browser-local storage unless you explicitly export a JSON backup.
- Folder Watch only reads the folder you explicitly grant access to.
- Guitar tab blocks are preserved; recognized chord-only lines can be transposed.

## Run

This is a static web app. Open `index.html` directly or deploy the repository to any static host such as Vercel.
