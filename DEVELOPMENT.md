# Tabbycat Desktop Development

## Purpose

The web app remains a valid static build. The desktop app is a Tauri 2 wrapper around the same frontend, with native filesystem capabilities added only where the browser version needs them.

The rule is: **one product, one behavior set, two delivery surfaces.**

## Daily development

1. Create a branch from `main`.
2. Make the smallest coherent change.
3. Run `npm run desktop:check`.
4. For desktop behavior, run `npm run desktop:dev` on a Mac with Rust installed.
5. Verify the acceptance checklist below.
6. Open a pull request.
7. Merge only after automated checks and the Mac acceptance pass are green.

## Commands

- `npm run desktop:sync` copies the canonical frontend into `desktop-dist/`.
- `npm run desktop:check` checks required files, JS syntax, and desktop version consistency.
- `npm run desktop:dev` launches the Tauri development build.
- `npm run desktop:build` creates the macOS app / DMG on macOS.

These are **developer commands**, not end-user commands.

## Runtime / storage

The desktop build does not require Node at runtime. Node is only used by the Tauri CLI during development/build.

Songs remain in the webview's local storage for the first desktop candidate so the product behavior is not rewritten during packaging. JSON export/import remains the portable backup path. Moving song storage into a native app-data store is a separate migration and must include explicit backup/migration tests.

## Folder Watch

Browser:
- File System Access API
- Chromium/HTTPS only
- IndexedDB stores the granted directory handle
- polling scan

Desktop:
- native Tauri directory picker
- read-only filesystem access to the directory the user chose
- persisted filesystem scope across restarts
- native filesystem watch
- same `lyrics_tmp*.txt` intake behavior

No broad home-folder filesystem scope is granted.

## Acceptance checklist

Before a desktop candidate is called releasable:

- Existing songbook loads.
- New song creation works.
- TXT file picker import works.
- Drag/drop TXT import works.
- Folder Watch can select a folder.
- New `lyrics_tmp*.txt` files are detected.
- Folder Watch reconnects after app restart.
- Search works.
- Metadata edits persist.
- Chord-only lines transpose.
- Guitar tab blocks do not transpose.
- Stage Mode works.
- Font sizing works.
- Auto-scroll works.
- JSON export works.
- JSON import restores a songbook.
- No browser-only folder-watch warning appears in the desktop build.
- Closing/reopening the app does not erase the songbook.

## Releases

Use SemVer.

- Patch: bug fix only.
- Minor: backward-compatible feature.
- Major: intentional breaking behavior or data format change.

A release is a tagged commit plus a generated artifact. Never replace the contents of an existing version tag.
