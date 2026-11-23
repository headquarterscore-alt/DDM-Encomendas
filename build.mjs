import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('.', import.meta.url));
const src = resolve(project, 'src');
const dist = resolve(project, 'dist');
const read = name => readFileSync(resolve(src, name), 'utf8');
const files = readdirSync(src, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => relative(src, resolve(entry.parentPath, entry.name)).split(sep).join('/'))
  .sort();

rmSync(dist, { recursive: true, force: true });
cpSync(src, dist, { recursive: true });
const template = readFileSync(resolve(project, 'service-worker.template.js'), 'utf8');
const hash = createHash('sha256').update(template);
for (const file of files) {
  hash.update(file).update('\0').update(readFileSync(resolve(src, file)));
}

// Keep the start page self-contained for installed copies of the app.
// Fail the build instead of publishing a broken page when a marker is missing.
const must = (text, needle) => {
  if (!text.includes(needle)) throw new Error('Build interrompido: não encontrei ' + needle);
  return text;
};
const logo = 'data:image/png;base64,' + readFileSync(resolve(src, 'marca.png')).toString('base64');
const cssTag = '<link rel="stylesheet" href="./estilo.css">';
let page = must(read('index.html'), cssTag);
page = must(page, './marca.png')
  .replace(cssTag, () => '<style>' + read('estilo.css') + '</style>')
  .replaceAll('./marca.png', logo);
for (const file of ['app.js', 'install.js']) {
  const tag = '<script type="module" src="./' + file + '"></script>';
  must(page, tag);
  const script = file === 'app.js'
    ? (await build({entryPoints:[resolve(src,file)],bundle:true,platform:'browser',format:'esm',minify:true,write:false})).outputFiles[0].text
    : read(file);
  if(file==='app.js') writeFileSync(resolve(dist,file),script);
  page = page.replace(tag, () => '<script type="module">' + script.replace(/<\/script/gi, '<\\/script') + '</script>');
}
hash.update(page);
// A separate review build uses a local store so trial orders never reach the shop.
let branch=process.env.WORKERS_CI_BRANCH||process.env.CF_PAGES_BRANCH;
if(!branch){try{branch=execFileSync('git',['branch','--show-current'],{cwd:project,encoding:'utf8'}).trim();}catch{}}
if(branch==='feat/folha-balcao'||process.argv.includes('--preview-folha')){
 const demo=await build({entryPoints:[resolve(src,'app.js')],bundle:true,platform:'browser',format:'esm',minify:true,write:false,
  inject:[resolve(project,'preview/folha-store.js')],
  plugins:[{name:'isolated-session',setup(builder){
   builder.onResolve({filter:/team-auth\.js$/},()=>({path:resolve(project,'preview/folha-session.js')}));
  }}]});
 let review=read('index.html').replace(cssTag,()=>'<style>'+read('estilo.css')+'</style>').replaceAll('./marca.png',logo)
  .replace('<script type="module" src="./install.js"></script>','')
  .replace('<script type="module" src="./app.js"></script>',()=>'<script type="module">'+demo.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
 review=review.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'">');
 writeFileSync(resolve(dist,'experimentar.html'),review);
}
const version = 'ddm-postos-' + hash.digest('hex').slice(0, 14);
must(template, '__DDM_CACHE__');
must(template, '"__DDM_ASSETS__"');
const worker = template.replace('__DDM_CACHE__', version)
  .replace('"__DDM_ASSETS__"', () => JSON.stringify(files.filter(file => file !== "index.html")));
writeFileSync(resolve(dist, 'sw.js'), worker);
writeFileSync(resolve(dist, 'index.html'), page);
console.log('App preparada em dist/ (' + version + ').');
