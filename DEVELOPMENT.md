# Tabbycat Development Process

Tabbycat follows the local-app workflow we want to reuse across Wollohy desktop software.

## Product rule

The released product is a normal Mac app. Shell commands, ports and build tools are developer concerns, not normal-user controls.

## Source of truth

- GitHub repository: `coldysquares/tabbycat`
- `main` is the canonical released source branch.
- Feature and packaging work happens on a branch and is merged only after the acceptance checklist passes.
- Release artifacts are generated from tagged source. Do not hand-edit a released `.app` or DMG.

## Local development

Prerequisites for developers only:

- Node.js
- npm
- Rust toolchain
- macOS command-line build tools when producing a Mac bundle

Install dependencies:

```sh
npm install
```

Run the existing web application:

```sh
npm run dev
```

Run the native desktop application:

```sh
npm run desktop:dev
```

Build the Mac application / DMG:

```sh
npm run desktop:build
```

Generated output lives under `src-tauri/target/` and is never the source of truth.

## Runtime architecture

The same Tabbycat UI remains usable as a static web app.

Inside Tauri, native adapters replace browser-specific operating-system integration where useful. The first desktop adapter is Folder Watch:

- Browser: File System Access API + IndexedDB handle + polling.
- Desktop: native folder dialog + Tauri filesystem watch.

The song parser, transposition, editor, Stage Mode, auto-scroll and import flow remain shared rather than being rewritten for desktop.

## Persistent user data

Current v0.2 compatibility behavior preserves the existing browser-local song store and JSON backup/import format. Do not remove or silently reset it during packaging work.

A later storage migration may move canonical song persistence to explicit app-data storage, but it must:

1. detect existing `tabbycatSongsV1` data,
2. make a backup before migration,
3. migrate once,
4. verify song count/content,
5. leave JSON export/import portable,
6. never overwrite data merely because the app was updated.

## Release discipline

Use semantic versions.

- Patch: bug fix with no intended feature change, e.g. `0.2.1`.
- Minor: backward-compatible feature or substantial packaging improvement, e.g. `0.3.0`.
- Major: intentionally breaking behavior/data contract.

Before a release:

1. Update version in `package.json` and `src-tauri/tauri.conf.json` / `Cargo.toml` together.
2. Run automated build checks.
3. Run `ACCEPTANCE.md` manually on the packaged app.
4. Fix regressions before tagging.
5. Tag the exact accepted commit.
6. Build release artifacts from that tag.
7. Keep older releases available for rollback.

## Non-negotiable migration rule

Packaging work does not get to redesign Tabbycat by accident.

If a feature exists in the accepted web build, the desktop migration either preserves it or explicitly documents why it is temporarily blocked. No silent feature deletion.
