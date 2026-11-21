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
  page = page.replace(tag, () => '<script type="module">' + read(file).replace(/<\/script/gi, '<\\/script') + '</script>');
}
hash.update(page);
const version = 'ddm-postos-' + hash.digest('hex').slice(0, 14);
must(template, '__DDM_CACHE__');
must(template, '"__DDM_ASSETS__"');
const worker = template.replace('__DDM_CACHE__', version)
  .replace('"__DDM_ASSETS__"', () => JSON.stringify(files.filter(file => file !== 'index.html')));
writeFileSync(resolve(dist, 'sw.js'), worker);
writeFileSync(resolve(dist, 'index.html'), page);
console.log('App preparada em dist/ (' + version + ').');
