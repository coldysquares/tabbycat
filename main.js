const STORAGE_KEY='tabbycatSongsV1';
const V1_KEY='localSongbookV1';
const WATCH_SCAN_KEY='songbookWatchLastScanV2';
const DB_NAME='TabbycatHandlesV1';
const makeId=()=>{try{if(globalThis.crypto?.randomUUID)return crypto.randomUUID()}catch(e){} return 'song-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)};
const $=s=>document.querySelector(s);
const NOTE_ORDER=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_TO_SHARP={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
const SECTION_RE=/^\s*\[(Intro|Verse|Chorus|Bridge|Pre[- ]?Chorus|Outro|Solo|Instrumental|Interlude|Break|Refrain)([^\]]*)\](.*)$/i;
const TAB_RE=/^\s*(?:[eEBGDA]\|)|\|[-0-9hHpPbBrRsSxX\\/().~^]+\|?/;
const CHORD_RE=/^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add|no)?\d*(?:[#b+\-]?\d+)*)?(?:\([^)]*\))?(?:\/[A-G](?:#|b)?)?$/i;
const NON_CHORD_OK_RE=/^(?:x\d+|\(x\d+\)|N\.?C\.?|[-–—|:]+)$/i;
const defaultSongs=[{id:makeId(),title:'Morning Test',artist:'',key:'C',capo:'0',tags:['demo'],source:'',body:'[Verse 1]\nC              G\nPlain text stays plain text\nAm             F\nChords live above the words\n\n[Chorus]\nC       G       F\nStage mode, scroll, and play'}];

let songs=loadSongs(); let currentId=songs[0]?.id||null; let transpose=0; let scrollTimer=null; let songSize=21; let pendingImport=null; let watchHandle=null; let watchTimer=null; let importQueue=[]; let toastTimer=null;
const songList=$('#songList'), search=$('#search'), titleInput=$('#titleInput'), artistInput=$('#artistInput'), keyInput=$('#keyInput'), capoInput=$('#capoInput'), tagsInput=$('#tagsInput'), bodyInput=$('#bodyInput'), viewTitle=$('#viewTitle'), viewMeta=$('#viewMeta'), sheet=$('#sheet'), sourceLine=$('#sourceLine');

function loadSongs(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const p=JSON.parse(raw);if(Array.isArray(p))return p;}}
  catch(e){}
  try{const old=localStorage.getItem(V1_KEY);if(old){const p=JSON.parse(old);if(Array.isArray(p)&&p.length){return p.map(s=>({...s,body:convertChordProToPlain(s.body||''),source:s.source||'',format:'plain'}));}}}
  catch(e){}
  return defaultSongs;
}
function convertChordProToPlain(body){
  if(!body.includes('[')) return body;
  const out=[];
  for(const line of body.split(/\r?\n/)){
    const sec=line.trim().match(/^\{([^}:]+)(?::([^}]+))?\}$/); if(sec){out.push('['+(sec[2]||sec[1]).replace(/-/g,' ')+']');continue;}
    if(!line.includes('[')){out.push(line);continue;}
    let lyric='', chordLine='', cursor=0; const re=/\[([^\]]+)\]/g; let m;
    while((m=re.exec(line))){const text=line.slice(cursor,m.index);lyric+=text; while(chordLine.length<lyric.length) chordLine+=' '; chordLine+=m[1]; cursor=re.lastIndex;}
    lyric+=line.slice(cursor); out.push(chordLine.replace(/\s+$/,'')); out.push(lyric);
  }
  return out.join('\n');
}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(songs));}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function current(){return songs.find(s=>s.id===currentId)||null;}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200);}

function transposeChord(chord,steps){
  if(!chord||steps===0||NON_CHORD_OK_RE.test(chord)) return chord;
  return chord.split('/').map((part,idx)=>{
    if(idx>0 && !/^[A-G][#b]?$/.test(part)) return part;
    const m=part.match(/^([A-G])([#b]?)(.*)$/i); if(!m)return part;
    let root=m[1].toUpperCase()+(m[2]||''); root=FLAT_TO_SHARP[root]||root; const i=NOTE_ORDER.indexOf(root); if(i<0)return part;
    return NOTE_ORDER[(i+steps+120)%12]+m[3];
  }).join('/');
}
function tokenizeNonspace(line){return line.match(/\S+/g)||[];}
function isChordToken(tok){return CHORD_RE.test(tok.replace(/[,.]$/,''));}
function isChordLine(line){
  if(!line.trim()||SECTION_RE.test(line)||TAB_RE.test(line))return false;
  const toks=tokenizeNonspace(line); if(!toks.length)return false;
  let chords=0, bad=0;
  toks.forEach(t=>{if(isChordToken(t))chords++;else if(!NON_CHORD_OK_RE.test(t))bad++;});
  return chords>=1 && bad===0;
}
function transposeChordLine(line){return line.replace(/\S+/g,t=>isChordToken(t)?transposeChord(t,transpose):t);}
function firstChord(body){for(const line of (body||'').split(/\r?\n/)){if(isChordLine(line)){const t=tokenizeNonspace(line).find(isChordToken);if(t)return t.match(/^[A-G][#b]?/i)?.[0]||'';}}return '';}
function renderBody(body){
  sheet.innerHTML='';
  for(const raw of (body||'').split(/\r?\n/)){
    const d=document.createElement('div'); d.className='sheet-line';
    const sec=raw.match(SECTION_RE);
    if(sec){d.classList.add('section');d.textContent='['+sec[1]+sec[2]+']'+(sec[3]||'');}
    else if(raw.trim()===''){d.classList.add('blank');d.textContent=' ';}
    else if(TAB_RE.test(raw)){d.classList.add('tab');d.textContent=raw;}
    else if(isChordLine(raw)){d.classList.add('chords');d.textContent=transposeChordLine(raw);}
    else if(/^\s*\([^)]{3,}\)\s*$/.test(raw)){d.classList.add('note');d.textContent=raw;}
    else d.textContent=raw;
    sheet.appendChild(d);
  }
}
function renderList(){
  const q=search.value.trim().toLowerCase();songList.innerHTML='';
  songs.filter(s=>!q||`${s.title} ${s.artist} ${(s.tags||[]).join(' ')}`.toLowerCase().includes(q)).forEach(s=>{
    const b=document.createElement('button');b.className='song-item'+(s.id===currentId?' active':'');b.innerHTML=`<strong>${esc(s.title||'Untitled')}</strong><span>${esc(s.artist||'')}${s.key?' · Key '+esc(s.key):''}</span>`;b.onclick=()=>{currentId=s.id;transpose=0;loadCurrent();};songList.appendChild(b);
  });
}
function renderViewer(){const s=current();if(!s)return;viewTitle.textContent=s.title||'Untitled';const meta=[];if(s.artist)meta.push(s.artist);if(s.key)meta.push(`Key ${transposeChord(s.key,transpose)}`);if(s.capo&&s.capo!=='0')meta.push(`Capo ${s.capo}`);if(s.tags?.length)meta.push(s.tags.join(' · '));viewMeta.textContent=meta.join('  •  ');renderBody(s.body||'');sourceLine.textContent=s.source?'Imported from '+s.source:'';}
function loadCurrent(){const s=current();if(!s){viewTitle.textContent='No song';viewMeta.textContent='';sheet.innerHTML='<div style="color:var(--muted)">Import or create a song.</div>';return;}titleInput.value=s.title||'';artistInput.value=s.artist||'';keyInput.value=s.key||'';capoInput.value=s.capo||'';tagsInput.value=(s.tags||[]).join(', ');bodyInput.value=s.body||'';renderViewer();renderList();updateTransposeLabel();}
function saveCurrent(){const s=current();if(!s)return;s.title=titleInput.value.trim()||'Untitled';s.artist=artistInput.value.trim();s.key=keyInput.value.trim();s.capo=capoInput.value.trim();s.tags=tagsInput.value.split(',').map(x=>x.trim()).filter(Boolean);s.body=bodyInput.value;persist();renderViewer();renderList();}
function updateTransposeLabel(){$('#transposeLabel').textContent=`Transpose ${transpose>0?'+':''}${transpose}`;}

function metadataFromFilename(name){
  const base=name.replace(/\.txt$/i,'').trim(); if(/^lyrics_tmp(?:[\s_\-()0-9.]*)?$/i.test(base))return {title:'',artist:''};
  const parts=base.split(/\s+-\s+/); if(parts.length===2)return {artist:parts[0].trim(),title:parts[1].trim()}; return {title:base,artist:''};
}
async function queueTextFile(file,sourceLabel){
  if(!file||!(/\.txt$/i.test(file.name)||file.type==='text/plain')){toast('That is not a TXT file.');return;}
  const body=await file.text(); const meta=metadataFromFilename(file.name); importQueue.push({body,fileName:file.name,source:sourceLabel||file.name,title:meta.title,artist:meta.artist,key:firstChord(body),capo:'0'}); if(!pendingImport)showNextImport();
}
function showNextImport(){
  pendingImport=importQueue.shift()||null;if(!pendingImport)return;
  $('#importFileLabel').textContent=pendingImport.fileName;$('#importTitle').value=pendingImport.title||'';$('#importArtist').value=pendingImport.artist||'';$('#importKey').value=pendingImport.key||'';$('#importCapo').value=pendingImport.capo||'0';$('#importModal').classList.remove('hidden');setTimeout(()=>($('#importTitle').value?$('#importArtist'):$('#importTitle')).focus(),40);
}
function closeImport(){pendingImport=null;$('#importModal').classList.add('hidden');if(importQueue.length)showNextImport();}
function confirmImport(){
  if(!pendingImport)return;const s={id:makeId(),title:$('#importTitle').value.trim()||'Untitled Import',artist:$('#importArtist').value.trim(),key:$('#importKey').value.trim(),capo:$('#importCapo').value.trim(),tags:['imported'],source:pendingImport.source||pendingImport.fileName,format:'plain',body:pendingImport.body,importedAt:new Date().toISOString()};songs.unshift(s);currentId=s.id;transpose=0;persist();closeImport();loadCurrent();toast('Added to Tabbycat.');
}

$('#newSongBtn').onclick=()=>{const s={id:makeId(),title:'Untitled',artist:'',key:'',capo:'0',tags:[],source:'',format:'plain',body:'[Verse 1]\nC                 G\nStart typing here…'};songs.unshift(s);currentId=s.id;transpose=0;persist();loadCurrent();titleInput.focus();titleInput.select();};
$('#saveBtn').onclick=()=>{saveCurrent();toast('Saved.');};
$('#deleteBtn').onclick=()=>{const s=current();if(!s)return;if(!confirm(`Delete “${s.title}”?`))return;songs=songs.filter(x=>x.id!==s.id);currentId=songs[0]?.id||null;persist();loadCurrent();};
search.oninput=renderList;
let persistDelay; bodyInput.addEventListener('input',()=>{const s=current();if(s){s.body=bodyInput.value;renderViewer();clearTimeout(persistDelay);persistDelay=setTimeout(persist,350);}});
[titleInput,artistInput,keyInput,capoInput,tagsInput].forEach(el=>el.addEventListener('input',()=>{const s=current();if(!s)return;s.title=titleInput.value;s.artist=artistInput.value;s.key=keyInput.value;s.capo=capoInput.value;s.tags=tagsInput.value.split(',').map(x=>x.trim()).filter(Boolean);renderViewer();renderList();clearTimeout(persistDelay);persistDelay=setTimeout(persist,350);}));
$('#transposeDown').onclick=()=>{transpose--;renderViewer();updateTransposeLabel();};$('#transposeUp').onclick=()=>{transpose++;renderViewer();updateTransposeLabel();};$('#resetTranspose').onclick=()=>{transpose=0;renderViewer();updateTransposeLabel();};
$('#stageBtn').onclick=()=>{document.body.classList.toggle('stage');$('#stageBtn').textContent=document.body.classList.contains('stage')?'Exit stage':'Stage mode';window.scrollTo({top:0,behavior:'smooth'});};
$('#smallerBtn').onclick=()=>{songSize=Math.max(13,songSize-1);document.documentElement.style.setProperty('--song-size',songSize+'px');};$('#largerBtn').onclick=()=>{songSize=Math.min(38,songSize+1);document.documentElement.style.setProperty('--song-size',songSize+'px');};
function stopScroll(){if(scrollTimer){clearInterval(scrollTimer);scrollTimer=null;}$('#scrollToggle').textContent='▶ Scroll';}function startScroll(){stopScroll();$('#scrollToggle').textContent='⏸ Pause';const px=Number($('#speedRange').value);scrollTimer=setInterval(()=>window.scrollBy(0,Math.max(.4,px/20)),50);}$('#scrollToggle').onclick=()=>scrollTimer?stopScroll():startScroll();$('#speedRange').oninput=()=>{$('#speedLabel').textContent=$('#speedRange').value+' px/s';if(scrollTimer)startScroll();};$('#scrollTopBtn').onclick=()=>{stopScroll();window.scrollTo({top:0,behavior:'smooth'});};

$('#txtInput').onchange=async e=>{const f=e.target.files?.[0];if(f)await queueTextFile(f,f.name);e.target.value='';};
$('#cancelImport').onclick=closeImport;$('#confirmImport').onclick=confirmImport;$('#importModal').addEventListener('click',e=>{if(e.target===$('#importModal'))closeImport();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#importModal').classList.contains('hidden'))closeImport();if((e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();saveCurrent();toast('Saved.');}});
let dragDepth=0;window.addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;document.body.classList.add('dragging');});window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('dragleave',e=>{e.preventDefault();dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)document.body.classList.remove('dragging');});window.addEventListener('drop',async e=>{e.preventDefault();dragDepth=0;document.body.classList.remove('dragging');const files=[...(e.dataTransfer?.files||[])];for(const f of files.filter(f=>/\.txt$/i.test(f.name)))await queueTextFile(f,f.name);});

$('#exportBtn').onclick=()=>{saveCurrent();const blob=new Blob([JSON.stringify({version:2,format:'plain-text',exportedAt:new Date().toISOString(),songs},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tabbycat-songbook.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#jsonInput').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.songs;if(!Array.isArray(incoming))throw new Error('No songs array found');songs=incoming.map(s=>({...s,id:s.id||makeId(),body:s.format==='plain'||data.version>=2?s.body:convertChordProToPlain(s.body||''),format:'plain'}));currentId=songs[0]?.id||null;persist();loadCurrent();toast('Tabbycat imported.');}catch(err){alert('Import failed: '+err.message);}finally{e.target.value='';}};
