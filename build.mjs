import { build } from 'esbuild';
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
// O reconhecimento é carregado apenas quando se escreve o nome à mão.
for(const [source,target] of [
 ['tesseract.js/dist/worker.min.js','worker.min.js'],
 ['tesseract.js-core/tesseract-core-lstm.wasm.js','core.wasm.js'],
 ['@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz','por.traineddata.gz']
])cpSync(resolve(project,'node_modules',source),resolve(dist,'ocr',target));
await build({entryPoints:[resolve(src,'handwriting.js')],bundle:true,format:'esm',minify:true,outfile:resolve(dist,'handwriting.js')});
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
const version = 'ddm-postos-' + hash.digest('hex').slice(0, 14);
must(template, '__DDM_CACHE__');
must(template, '"__DDM_ASSETS__"');
const worker = template.replace('__DDM_CACHE__', version)
  .replace('"__DDM_ASSETS__"', () => JSON.stringify(files.filter(file => !["index.html","handwriting.js"].includes(file))));
writeFileSync(resolve(dist, 'sw.js'), worker);
writeFileSync(resolve(dist, 'index.html'), page);
console.log('App preparada em dist/ (' + version + ').');
