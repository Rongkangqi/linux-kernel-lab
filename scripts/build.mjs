import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { marked } from 'marked';
const root = new URL('../', import.meta.url);
const { stages, platforms, extensions } = JSON.parse(await readFile(new URL('content/curriculum.json', root), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('content/manifest.json', root), 'utf8'));
const pages = [];
for (const entry of manifest) {
  const markdown = await readFile(new URL(`docs/${entry.id}.md`, root), 'utf8');
  let count = 0;
  const toc = [];
  const renderer = new marked.Renderer();
  const baseLink = renderer.link.bind(renderer);
  const baseImage = renderer.image.bind(renderer);
  const assetPath = href => /^figures\/[\w-]+\.svg$/.test(href) ? `./docs/${href}` : href;
  renderer.link = token => baseLink({ ...token, href: /^[\w-]+\.md$/.test(token.href) ? `#/docs/${token.href.slice(0,-3)}` : assetPath(token.href) });
  renderer.image = token => baseImage({ ...token, href: assetPath(token.href) });
  renderer.heading = ({ tokens, depth, text }) => {
    const id = `section-${++count}`;
    if (depth === 2 || depth === 3) toc.push({ id, depth, title: text.replace(/[`*_]/g, '') });
    return `<h${depth} id="${id}">${renderer.parser.parseInline(tokens)}</h${depth}>`;
  };
  const html = marked.parse(markdown, { renderer, gfm: true });
  pages.push({ ...entry, html, toc, words: markdown.length, text: markdown.replace(/[#*`>|]/g, '').replace(/\s+/g, ' '), source: `docs/${entry.id}.md` });
}
await mkdir(new URL('dist/', root), { recursive: true });
await cp(new URL('web/', root), new URL('dist/', root), { recursive: true });
await cp(new URL('docs/', root), new URL('dist/docs/', root), { recursive: true });
await writeFile(new URL('dist/content.json', root), JSON.stringify({ stages, platforms, extensions, pages, updated: '2026-11-22' }));
await writeFile(new URL('dist/.nojekyll', root), '');
console.log(`Built ${pages.length} learning documents, ${stages.length} stages and ${platforms.length} platform guides.`);
