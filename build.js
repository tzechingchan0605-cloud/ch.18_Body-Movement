import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const js=['model.js','i18n.js','renderer.js','app.js'].map(f=>read(f).replace(/^import .*;$/gm,'').replace(/export /g,'')).join('\n');
const html=read('index.html').replace('<link rel="stylesheet" href="style.css">','<style>'+read('style.css')+'</style>').replace('<script type="module" src="app.js"></script>','<script>(()=>{'+js+'\n})();</script>');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});writeFileSync(new URL('./dist/index.html',import.meta.url),html);console.log('Built dist/index.html: self-contained, opens directly offline.');
