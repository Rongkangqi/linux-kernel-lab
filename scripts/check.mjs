import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p,root),'utf8');
const built = JSON.parse(await read('dist/content.json'));
const manifest = JSON.parse(await read('content/manifest.json'));
const ids = new Set(manifest.map(p=>p.id));
assert.equal(ids.size,manifest.length,'Duplicate document IDs');
assert.equal(built.pages.length,manifest.length,'Build omitted documents');
assert.equal(built.stages.reduce((sum,s)=>sum+s.duration,0),32,'Week allocation is inconsistent');
assert.equal(built.pages.filter(p=>p.kind==='lab').length,9,'Lab index is incomplete');
let links=0;
for(const p of built.pages){
  assert(p.html.length>500,`Empty or placeholder document: ${p.id}`);
  assert(p.toc.length>=3,`Missing document structure: ${p.id}`);
  const markdown=await read(p.source);
  assert.equal(await read(`dist/${p.source}`),markdown,`Downloadable Markdown is missing or stale: ${p.id}`);
  assert.equal((markdown.match(/^```/gm)||[]).length%2,0,`Unclosed code fence: ${p.id}`);
  assert(!/C:\\Users\\|token=|password=/i.test(markdown),`Private environment detail in ${p.id}`);
  for(const link of markdown.matchAll(/\]\(([\w-]+)\.md\)/g)) { assert(ids.has(link[1]),`Broken document link ${p.id} → ${link[1]}`); assert(p.html.includes(`#/docs/${link[1]}`),`Document route was not generated: ${p.id}`); links++; }
  for(const t of p.toc) assert(p.html.includes(`id="${t.id}"`),`Broken heading anchor ${p.id}`);
  assert(p.text.length>100,`Missing search content ${p.id}`);
}
for(const s of built.stages){ assert(ids.has(s.id),`Missing stage ${s.id}`); assert(ids.has(s.lab),`Missing lab ${s.lab}`); }
for(const p of built.platforms) assert(ids.has(p.id),`Missing platform ${p.id}`);
const index=await read('dist/index.html');
for(const asset of ['app.js','style.css','favicon.svg']){ await access(new URL(`dist/${asset}`,root)); assert(index.includes(asset),`Unreferenced asset ${asset}`); }
for(const file of ['web/app.js','scripts/build.mjs','scripts/serve.mjs']) {
  const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL(file,root))],{encoding:'utf8'});
  assert.equal(result.status,0,`${file}: ${result.stderr}`);
}
console.log(`Content check passed: ${ids.size} documents, ${links} internal links, 32 weeks, 9 labs, all stage/platform routes and heading anchors valid.`);
