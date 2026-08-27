const DESKTOP_WATCH_FOLDER_KEY='tabbycatDesktopWatchFolderV1';
const DESKTOP_WATCH_SCAN_KEY='tabbycatDesktopWatchLastScanV1';
const IS_TAURI=Boolean(window.__TAURI__?.dialog && window.__TAURI__?.fs);

if(IS_TAURI){
  let desktopUnwatch=null;
  let desktopFolder=localStorage.getItem(DESKTOP_WATCH_FOLDER_KEY)||'';

  const {open}=window.__TAURI__.dialog;
  const {readDir,readTextFile,stat,watch}=window.__TAURI__.fs;
  const {join}=window.__TAURI__.path;

  async function stopDesktopWatch(message='FOLDER WATCH: OFF'){
    if(desktopUnwatch){
      try{desktopUnwatch();}catch(e){}
      desktopUnwatch=null;
    }
    $('#watchState').textContent=message;
    $('#watchBtn').textContent='WATCH FOLDER';
  }

  async function scanDesktopFolder(folder,{firstConnect=false}={}){
    const fallback=Date.now()-300000;
    const last=firstConnect?fallback:Number(localStorage.getItem(DESKTOP_WATCH_SCAN_KEY)||fallback);
    let newest=Date.now();

    const entries=await readDir(folder);
    for(const entry of entries){
      if(!entry.isFile||!/^lyrics_tmp.*\.txt$/i.test(entry.name))continue;
      const filePath=await join(folder,entry.name);
      const info=await stat(filePath);
      const modified=info.mtime?new Date(info.mtime).getTime():0;
      newest=Math.max(newest,modified||0);
      if(modified && modified<=last+1000)continue;

      const body=await readTextFile(filePath);
      const file=new File([body],entry.name,{type:'text/plain',lastModified:modified||Date.now()});
      await queueTextFile(file,filePath);
    }

    localStorage.setItem(DESKTOP_WATCH_SCAN_KEY,String(Math.max(Date.now()-1000,newest)));
    $('#watchState').textContent=`WATCHING “${folder}” FOR lyrics_tmp*.txt`;
  }

  async function startDesktopWatch(folder,{firstConnect=false}={}){
    await stopDesktopWatch('CONNECTING FOLDER…');
    await scanDesktopFolder(folder,{firstConnect});
    desktopFolder=folder;
    localStorage.setItem(DESKTOP_WATCH_FOLDER_KEY,folder);

    desktopUnwatch=await watch(folder,async()=>{
      try{await scanDesktopFolder(folder);}catch(err){
        console.error('Tabbycat folder scan failed',err);
        $('#watchState').textContent='FOLDER WATCH ERROR · CLICK TO RECONNECT';
      }
    },{recursive:false,delayMs:500});

    $('#watchBtn').textContent='STOP WATCH';
    $('#watchState').textContent=`WATCHING “${folder}” FOR lyrics_tmp*.txt`;
  }

  $('#watchBtn').onclick=async()=>{
    if(desktopUnwatch){
      await stopDesktopWatch();
      return;
    }

    try{
      const folder=await open({
        directory:true,
        multiple:false,
        title:'Choose a folder for Tabbycat to watch'
      });
      if(!folder)return;
      localStorage.setItem(DESKTOP_WATCH_SCAN_KEY,String(Date.now()-300000));
      await startDesktopWatch(folder,{firstConnect:true});
    }catch(err){
      console.error('Tabbycat folder watch failed',err);
      await stopDesktopWatch('FOLDER WATCH FAILED · CLICK TO TRY AGAIN');
      alert('Folder watch failed: '+(err?.message||err));
    }
  };

  (async()=>{
    if(!desktopFolder)return;
    try{
      await startDesktopWatch(desktopFolder);
    }catch(err){
      console.warn('Saved Tabbycat watch folder needs reconnect',err);
      await stopDesktopWatch('SAVED FOLDER FOUND · CLICK WATCH FOLDER TO RECONNECT');
    }
  })();
}else{
  function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('handles');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async function idbSet(key,val){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(val,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  async function idbGet(key){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('handles','readonly');const r=tx.objectStore('handles').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
  function stopWatch(){if(watchTimer){clearInterval(watchTimer);watchTimer=null;}$('#watchState').textContent='Folder watch off.';$('#watchBtn').textContent='Watch folder';}
  async function scanWatchFolder(){
    if(!watchHandle)return;let perm='prompt';try{perm=await watchHandle.queryPermission({mode:'read'});}catch(e){}if(perm!=='granted'){stopWatch();$('#watchState').textContent='Folder permission needs approval.';return;}
    const last=Number(localStorage.getItem(WATCH_SCAN_KEY)||Date.now()-300000);let newest=Date.now();
    try{for await(const [name,handle] of watchHandle.entries()){
      if(handle.kind!=='file'||!/^lyrics_tmp.*\.txt$/i.test(name))continue;const f=await handle.getFile();newest=Math.max(newest,f.lastModified);if(f.lastModified>last+1000){await queueTextFile(f,`${watchHandle.name}/${name}`);}
    }localStorage.setItem(WATCH_SCAN_KEY,String(Math.max(Date.now()-1000,newest)));$('#watchState').textContent=`Watching “${watchHandle.name}” for lyrics_tmp*.txt`;
    }catch(e){$('#watchState').textContent='Could not scan folder: '+e.message;}
  }
  async function startWatch(handle,fromUser=false){watchHandle=handle;let perm='prompt';try{perm=await handle.queryPermission({mode:'read'});if(perm!=='granted'&&fromUser)perm=await handle.requestPermission({mode:'read'});}catch(e){}if(perm!=='granted'){stopWatch();return false;}$('#watchBtn').textContent='Stop watch';$('#watchState').textContent=`Watching “${handle.name}”…`;if(fromUser)localStorage.setItem(WATCH_SCAN_KEY,String(Date.now()-300000));await scanWatchFolder();clearInterval(watchTimer);watchTimer=setInterval(scanWatchFolder,2500);return true;}
  $('#watchBtn').onclick=async()=>{if(watchTimer){stopWatch();return;}if(!('showDirectoryPicker' in window)){alert('Folder watching needs a Chromium browser on localhost/HTTPS. TXT import and drag/drop still work normally.');return;}try{const h=await window.showDirectoryPicker({mode:'read'});await idbSet('watchFolder',h);await startWatch(h,true);}catch(e){if(e.name!=='AbortError')alert('Folder watch failed: '+e.message);}};
  (async()=>{if(!('showDirectoryPicker'in window)){$('#watchState').textContent='Folder watch unavailable here; Import TXT/drop still works.';return;}try{const h=await idbGet('watchFolder');if(h){watchHandle=h;const p=await h.queryPermission({mode:'read'});if(p==='granted')await startWatch(h,false);else $('#watchState').textContent='Saved folder found. Click Watch folder to reconnect.';}}catch(e){}})();
}

window.addEventListener('beforeunload',persist);loadCurrent();
