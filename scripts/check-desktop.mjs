import {readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const required=[
  'index.html','styles.css','main.js','watch.js',
  'src-tauri/Cargo.toml','src-tauri/build.rs',
  'src-tauri/src/main.rs','src-tauri/src/lib.rs',
  'src-tauri/tauri.conf.json','src-tauri/capabilities/default.json'
];

for(const file of required){
  await access(resolve(root,file));
}

for(const file of ['main.js','watch.js']){
  const result=spawnSync(process.execPath,['--check',resolve(root,file)],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
}

const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const tauri=JSON.parse(await readFile(resolve(root,'src-tauri/tauri.conf.json'),'utf8'));
if(pkg.version!==tauri.version){
  throw new Error(`Version mismatch: package.json=${pkg.version}, tauri.conf.json=${tauri.version}`);
}
if(tauri.identifier!=='com.coldysquares.tabbycat'){
  throw new Error('Unexpected Tauri bundle identifier');
}

console.log(`Tabbycat desktop checks passed for v${pkg.version}`);
