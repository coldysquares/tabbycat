import { open } from '@tauri-apps/plugin-dialog';
import { watch, readTextFile } from '@tauri-apps/plugin-fs';
import { Store } from '@tauri-apps/plugin-store';

const watchBtn = document.querySelector('#watchBtn');
const watchState = document.querySelector('#watchState');

if (!window.__TAURI_INTERNALS__ || !watchBtn || !watchState) {
  // Browser build keeps using watch.js.
} else {
  const store = await Store.load('tabbycat-settings.json');
  let stopWatching = null;

  const basename = path => path.split(/[\\/]/).pop() || path;
  const isTarget = path => /^lyrics_tmp.*\.txt$/i.test(basename(path));

  async function ingestPath(path) {
    if (!isTarget(path)) return;
    try {
      const text = await readTextFile(path);
      if (typeof window.tabbycatQueueText === 'function') {
        await window.tabbycatQueueText({
          name: basename(path),
          text,
          source: path
        });
      }
    } catch (error) {
      watchState.textContent = `COULD NOT READ: ${basename(path)}`;
      console.error('Tabbycat native watch read failed', error);
    }
  }

  async function stopNativeWatch() {
    if (stopWatching) {
      try { stopWatching(); } catch (_) {}
      stopWatching = null;
    }
    watchBtn.textContent = 'WATCH FOLDER';
    watchState.textContent = 'FOLDER WATCH: OFF';
  }

  async function startNativeWatch(folder) {
    await stopNativeWatch();
    stopWatching = await watch(folder, async event => {
      const paths = Array.isArray(event.paths) ? event.paths : [];
      for (const path of paths) await ingestPath(path);
    }, { recursive: false, delayMs: 500 });

    await store.set('watchFolder', folder);
    await store.save();
    watchBtn.textContent = 'STOP WATCH';
    watchState.textContent = `WATCHING “${basename(folder)}” FOR lyrics_tmp*.txt`;
  }

  watchBtn.onclick = async () => {
    if (stopWatching) {
      await stopNativeWatch();
      return;
    }

    const folder = await open({ directory: true, multiple: false, title: 'Choose Tabbycat watch folder' });
    if (!folder) return;

    try {
      await startNativeWatch(folder);
    } catch (error) {
      watchState.textContent = 'FOLDER WATCH COULD NOT START';
      console.error('Tabbycat native watcher failed', error);
    }
  };

  try {
    const saved = await store.get('watchFolder');
    if (saved) {
      watchState.textContent = `SAVED FOLDER: ${basename(saved)} · CLICK WATCH FOLDER TO RECONNECT`;
    } else {
      watchState.textContent = 'FOLDER WATCH: OFF';
    }
  } catch (error) {
    console.error('Tabbycat settings load failed', error);
  }
}
