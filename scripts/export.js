import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const [html, css, numbers, engine, app] = await Promise.all(['index.html', 'style.css', 'numbers.js', 'engine.js', 'app.js'].map(read));
const inline = source => source.replace(/^import .*?;\s*$/gm, '').replace(/^export \{.*?\} from .*?;\s*$/gm, '').replace(/^export /gm, '');
const code = [numbers, engine, app].map(inline).join('\n');
const classic = `(() => {\n${code}\n})();\n`;
// Keep the standalone app in its own scope, with no modules or network requests.
const bundled = html
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script src="game.js" defer></script>', () => `<script>${classic.replace(/<\/script/gi, '<\\/script')}</script>`);
await writeFile(new URL('game.js', root), classic);
await writeFile(new URL('play.html', root), bundled);
console.log('Created game.js and play.html — index.html and play.html can open directly in your browser.');
