// Makes WebP copies of every photo in public/images at a few widths, and writes
// src/generated/images.json so the site can offer them with the right sizes.
// Runs before `npm run dev` and `npm run build`; unchanged images are skipped.
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'public/images');
const OUT_DIR = path.join(SOURCE_DIR, 'generated');
const MANIFEST = path.join(ROOT, 'src/generated/images.json');
const WIDTHS = [480, 960, 1600];
const QUALITY = 78;
const SOURCE_TYPES = /\.(jpe?g|png)$/i;

async function isFresh(output, sourceTime) {
  try {
    return (await stat(output)).mtimeMs >= sourceTime;
  } catch {
    return false;
  }
}

async function processImage(file) {
  const source = path.join(SOURCE_DIR, file);
  const { mtimeMs } = await stat(source);
  // autoOrient gives the size as displayed, after any EXIF rotation.
  const meta = await sharp(source).metadata();
  const { width, height } = meta.autoOrient ?? meta;
  const base = path.parse(file).name;
  const widths = WIDTHS.filter((w) => w < width).concat(Math.min(width, WIDTHS.at(-1)));
  const variants = [];

  for (const w of [...new Set(widths)]) {
    const name = `${base}-${w}.webp`;
    const output = path.join(OUT_DIR, name);
    if (!(await isFresh(output, mtimeMs))) {
      await sharp(source).rotate().resize({ width: w }).webp({ quality: QUALITY }).toFile(output);
    }
    variants.push({ src: `/images/generated/${name}`, width: w });
  }
  return [`/images/${file}`, { width, height, webp: variants }];
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });
  const files = (await readdir(SOURCE_DIR)).filter((f) => SOURCE_TYPES.test(f)).sort();
  const bases = files.map((f) => path.parse(f).name);
  const clash = bases.find((b, i) => bases.indexOf(b) !== i);
  if (clash) throw new Error(`two images are named "${clash}" (e.g. .jpg and .png); rename one`);
  const entries = [];
  for (const file of files) entries.push(await processImage(file));

  // Remove copies of images that no longer exist.
  const keep = new Set(entries.flatMap(([, info]) => info.webp.map((v) => path.basename(v.src))));
  for (const name of await readdir(OUT_DIR)) {
    if (!keep.has(name)) await rm(path.join(OUT_DIR, name));
  }

  await writeFile(MANIFEST, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`);
  console.log(`images: ${files.length} source image(s), ${keep.size} WebP file(s)`);
}

main().catch((error) => {
  console.error(`images: ${error.message}`);
  process.exit(1);
});
