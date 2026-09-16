const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const sourceDir = path.resolve('assets', 'stories', 'originals');
const outputDir = path.resolve('assets', 'stories');
const widths = [400, 800];

async function main() {
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  const files = await fs.readdir(sourceDir);
  const sources = files.filter((file) => /\.(png|jpe?g|tiff?)$/i.test(file));
  await Promise.all(sources.flatMap((file) => {
    const base = path.basename(file, path.extname(file));
    return widths.map((width) => sharp(path.join(sourceDir, file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(outputDir, `${base}-${width}w.webp`)));
  }));
  console.log(`Optimized ${sources.length} source image(s) at ${widths.join(', ')}px.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
