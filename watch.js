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

window.addEventListener('beforeunload',persist);loadCurrent();
