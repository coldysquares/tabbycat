import {cp,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const out=resolve(root,'desktop-dist');
const files=['index.html','styles.css','main.js','watch.js'];

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

for(const file of files){
  await cp(resolve(root,file),resolve(out,file));
}

console.log(`Synced ${files.length} frontend files to desktop-dist/`);
