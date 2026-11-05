// Builds the achievements manifest.
//
// assets/achievements/achievements.json is the file you edit by hand. Each entry:
//   { "file": "f1.jpeg", "title": "Some award", "url": "https://article-link", "alt": "optional" }
// Any image sitting in assets/achievements/ that is not listed yet gets appended
// automatically (no link, title from the file name). Entries whose image is gone are dropped.
//
// Usage:
//   node scripts/build-achievements.mjs --out _site/assets/achievements/achievements.json   (CI)
//   node scripts/build-achievements.mjs --write                                              (adds new images to the repo file)

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const DIR = 'assets/achievements';
const MANIFEST = path.join(DIR, 'achievements.json');
const IMG = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const value = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

let curated = [];
try {
  const raw = JSON.parse(await readFile(MANIFEST, 'utf8'));
  curated = Array.isArray(raw) ? raw : (raw.achievements || []);
} catch (e) {
  if (e.code !== 'ENOENT') {
    console.error(`Could not parse ${MANIFEST}: ${e.message}`);
    process.exit(1);
  }
}

const onDisk = (await readdir(DIR))
  .filter(name => IMG.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const diskSet = new Set(onDisk);

const kept = [];
for (const item of curated) {
  if (!item || !item.file) continue;
  if (diskSet.has(item.file)) kept.push(item);
  else console.warn(`Skipping "${item.file}": not found in ${DIR}`);
}

const known = new Set(kept.map(i => i.file));
const added = onDisk.filter(f => !known.has(f));
for (const file of added) {
  const title = file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  kept.push({ file, title, url: '' });
  console.log(`New image found: ${file}`);
}

const out = JSON.stringify(kept, null, 2) + '\n';

if (flag('--write')) {
  await writeFile(MANIFEST, out);
  console.log(`Wrote ${kept.length} entries to ${MANIFEST}`);
}
const outPath = value('--out');
if (outPath) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, out);
  console.log(`Wrote ${kept.length} entries to ${outPath}`);
}
if (!flag('--write') && !outPath) console.log(out);
