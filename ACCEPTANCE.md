# Tabbycat Desktop Acceptance Checklist

Run this against the packaged Mac app before merging/releasing desktop changes.

## Launch / installation

- [ ] `Tabbycat.app` opens from Finder / Applications without Terminal.
- [ ] App window loads the accepted Tabbycat visual design correctly.
- [ ] Closing and reopening the app preserves existing song data.
- [ ] Updating the app does not clear existing song data.

## Songbook

- [ ] Existing songs appear in the library.
- [ ] Search filters by song / artist / tag.
- [ ] New Song creates an editable song.
- [ ] Title, artist, key, capo and tags persist.
- [ ] Raw guitarist plaintext spacing is preserved.
- [ ] Section labels render distinctly.
- [ ] Guitar tab lines are not transposed.
- [ ] Chord-only lines are detected and transposed.
- [ ] Slash chords behave correctly.
- [ ] Delete requires confirmation.

## Import / backup

- [ ] IMPORT TXT opens a file picker and imports a `.txt` file.
- [ ] Dragging a `.txt` file into the app opens the import flow.
- [ ] Import asks for / confirms title, artist, key and capo.
- [ ] JSON export downloads a complete backup.
- [ ] JSON import restores the exported songbook.
- [ ] Legacy V1 song data still migrates through the existing compatibility path.

## Folder Watch

- [ ] WATCH FOLDER opens a native macOS folder picker in the desktop app.
- [ ] User can choose Downloads, Desktop or Documents.
- [ ] New `lyrics_tmp*.txt` files trigger the normal import flow.
- [ ] Unrelated files are ignored.
- [ ] STOP WATCH stops watching without deleting or moving files.
- [ ] The chosen folder name is remembered for orientation but watching does not silently resume without the required access.
- [ ] Browser build still uses the existing browser folder-watch implementation.

## Performance view

- [ ] Stage Mode enters and exits cleanly.
- [ ] Font size controls work.
- [ ] Auto-scroll starts, pauses and changes speed.
- [ ] Scroll-to-top works.
- [ ] Transpose controls remain available and legible.

## Regression / UX

- [ ] No ChordPro syntax is introduced into the normal product workflow.
- [ ] The locked Tabbycat brand / visual language remains intact.
- [ ] No developer commands, ports or Tauri terminology are required for ordinary use.
- [ ] No placeholder features or fake success states are visible.

## Release decision

A release candidate is accepted only when all applicable boxes above pass on the actual packaged Mac application. A source build passing is not sufficient by itself.
