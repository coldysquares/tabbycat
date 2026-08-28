(()=>{
  const UI_KEY='tabbycatWebUiV1';
  const mobileQuery=window.matchMedia('(max-width:760px)');
  const stageBtn=$('#stageBtn');
  const speedRange=$('#speedRange');
  const watchBtn=$('#watchBtn');

  function readPrefs(){
    try{return JSON.parse(localStorage.getItem(UI_KEY)||'{}')||{};}catch(e){return {};}
  }
  function writePrefs(extra={}){
    const prev=readPrefs();
    const next={...prev,currentId,songSize,speed:Number(speedRange?.value||prev.speed||4),...extra};
    try{localStorage.setItem(UI_KEY,JSON.stringify(next));}catch(e){}
  }

  const nav=document.createElement('nav');
  nav.className='mobile-nav';
  nav.setAttribute('aria-label','Tabbycat views');
  nav.innerHTML=`
    <button type="button" id="mobileSongsBtn" aria-label="Open song library">Songs</button>
    <button type="button" id="mobilePlayBtn" class="active" aria-label="Show song">Play</button>
    <button type="button" id="mobileEditBtn" aria-label="Edit song">Edit</button>`;
  document.body.appendChild(nav);

  const closeLibrary=document.createElement('button');
  closeLibrary.type='button';
  closeLibrary.id='closeLibraryBtn';
  closeLibrary.className='btn mobile-close';
  closeLibrary.textContent='Done';
  $('.brand-zone')?.insertBefore(closeLibrary,$('#newSongBtn'));

  const songsBtn=$('#mobileSongsBtn');
  const playBtn=$('#mobilePlayBtn');
  const editBtn=$('#mobileEditBtn');

  function updateNav(mode='play'){
    [songsBtn,playBtn,editBtn].forEach(b=>b?.classList.remove('active'));
    if(mode==='songs')songsBtn?.classList.add('active');
    else if(mode==='edit')editBtn?.classList.add('active');
    else playBtn?.classList.add('active');
  }
  function closeLibraryPane(){
    document.body.classList.remove('mobile-library-open');
    updateNav(document.body.classList.contains('mobile-edit')?'edit':'play');
  }
  function showLibrary(){
    if(!mobileQuery.matches){search?.focus();return;}
    document.body.classList.add('mobile-library-open');
    updateNav('songs');
    setTimeout(()=>search?.focus(),30);
  }
  function showPlay(){
    document.body.classList.remove('mobile-edit','mobile-library-open');
    updateNav('play');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function showEdit(){
    document.body.classList.add('mobile-edit');
    document.body.classList.remove('mobile-library-open');
    updateNav('edit');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  songsBtn?.addEventListener('click',()=>document.body.classList.contains('mobile-library-open')?closeLibraryPane():showLibrary());
  playBtn?.addEventListener('click',showPlay);
  editBtn?.addEventListener('click',showEdit);
  closeLibrary.addEventListener('click',closeLibraryPane);

  const prefs=readPrefs();
  if(prefs.currentId&&songs.some(s=>s.id===prefs.currentId))currentId=prefs.currentId;
  if(Number.isFinite(Number(prefs.songSize))){
    songSize=Math.max(13,Math.min(38,Number(prefs.songSize)));
    document.documentElement.style.setProperty('--song-size',songSize+'px');
  }else if(mobileQuery.matches){
    songSize=18;
  }
  if(speedRange&&Number.isFinite(Number(prefs.speed))){
    speedRange.value=String(Math.max(1,Math.min(14,Number(prefs.speed))));
    $('#speedLabel').textContent=speedRange.value+' px/s';
  }
  loadCurrent();

  songList?.addEventListener('click',e=>{
    if(!e.target.closest('.song-item'))return;
    writePrefs({currentId});
    if(mobileQuery.matches)showPlay();
  });
  $('#newSongBtn')?.addEventListener('click',()=>{
    writePrefs({currentId});
    if(mobileQuery.matches)showEdit();
  });
  $('#confirmImport')?.addEventListener('click',()=>{
    setTimeout(()=>{
      writePrefs({currentId});
      if(mobileQuery.matches)showPlay();
    },0);
  });
  $('#deleteBtn')?.addEventListener('click',()=>setTimeout(()=>writePrefs({currentId}),0));
  $('#smallerBtn')?.addEventListener('click',()=>setTimeout(writePrefs,0));
  $('#largerBtn')?.addEventListener('click',()=>setTimeout(writePrefs,0));
  speedRange?.addEventListener('input',()=>writePrefs());

  stageBtn?.addEventListener('click',()=>{
    if(document.body.classList.contains('stage')){
      document.body.classList.remove('mobile-edit','mobile-library-open');
      updateNav('play');
    }
  });

  if(!('showDirectoryPicker' in window)&&watchBtn){
    watchBtn.disabled=true;
    watchBtn.textContent='Watch N/A';
    watchBtn.title='Folder Watch is not supported by this browser. Import TXT and drag/drop still work.';
    $('#watchState').textContent='Folder Watch unavailable here. Import TXT and drag/drop still work.';
  }

  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();
      showLibrary();
      search?.select();
      return;
    }
    if(e.key==='Escape'){
      if(document.body.classList.contains('mobile-library-open')){closeLibraryPane();return;}
      if(document.body.classList.contains('stage')&&$('#importModal')?.classList.contains('hidden'))stageBtn?.click();
    }
  });

  function handleViewport(){
    if(!mobileQuery.matches){
      document.body.classList.remove('mobile-edit','mobile-library-open');
      updateNav('play');
    }
  }
  mobileQuery.addEventListener?.('change',handleViewport);
  window.addEventListener('beforeunload',()=>writePrefs({currentId}));
})();
