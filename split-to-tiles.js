// Split a big image (1.png) into tiles identical to original_images and write them into zima1
// Usage: node split-to-tiles.js [--in=1.png]

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '.')
const SRC_DIR = path.join(ROOT, 'original_images')
const OUT_DIR = path.join(ROOT, 'zima2')

const SUFFIX = 'l11sd2'
const COLS = 33

const INPUT_ARG = (process.argv.find(a => a.startsWith('--in=')) || '').split('=')[1]
const INPUT_IMAGE = path.join(ROOT, INPUT_ARG)

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

function parseIdFromName(filename) {
  // Expecting pattern: <id>_<suffix>.jpg
  const name = path.basename(filename)
  const [idStr] = name.split('_')
  const id = Number(idStr)
  if (!Number.isFinite(id)) return null
  return id
}

async function listSourceFiles() {
  const entries = await fs.readdir(SRC_DIR)
  return entries
    .filter(f => f.endsWith('.jpg') && f.includes(`_${SUFFIX}`))
    .map(f => path.join(SRC_DIR, f))
}

async function main() {
  // Validate input image exists
  try {
    await fs.access(INPUT_IMAGE)
  } catch {
    console.error(`Input image not found: ${INPUT_IMAGE}`)
    process.exit(1)
  }

  const files = await listSourceFiles()
  if (!files.length) {
    console.error(`No source files found in ${SRC_DIR} for suffix ${SUFFIX}`)
    process.exit(1)
  }

  // Collect ids and detect tile size from original_images
  const ids = files
    .map(f => parseIdFromName(f))
    .filter(id => id !== null)
    .sort((a, b) => a - b)

  let tileW = 0, tileH = 0
  for (const id of ids) {
    const file = path.join(SRC_DIR, `${id}_${SUFFIX}.jpg`)
    try {
      const meta = await sharp(file).metadata()
      if (meta.width && meta.height) {
        tileW = meta.width
        tileH = meta.height
        break
      }
    } catch { /* continue searching */ }
  }
  if (!tileW || !tileH) {
    console.error('Unable to detect tile size from source images')
    process.exit(1)
  }

  const rows = ids.map(id => Math.floor(id / COLS))
  const minRow = Math.min(...rows)
  const maxRow = Math.max(...rows)
  const rowCount = maxRow - minRow + 1

  const expectedWidth = COLS * tileW
  const expectedHeight = rowCount * tileH

  const bigMeta = await sharp(INPUT_IMAGE).metadata()
  if (bigMeta.width !== expectedWidth || bigMeta.height !== expectedHeight) {
    console.error('Input image size does not match expected grid derived from original_images:')
    console.error(` - Expected: ${expectedWidth}x${expectedHeight} (tile ${tileW}x${tileH}, cols ${COLS}, rows ${rowCount})`)
    console.error(` - Actual:   ${bigMeta.width}x${bigMeta.height}`)
    console.error('Abort without resizing. Adjust input image or layout constants.')
    process.exit(1)
  }

  await ensureDir(OUT_DIR)

  console.log(`Splitting ${path.basename(INPUT_IMAGE)} into ${ids.length} tiles -> ${OUT_DIR}`)
  console.log(`Tile size: ${tileW}x${tileH}, grid: ${COLS}x${rowCount}`)

  let written = 0
  for (const id of ids) {
    const col = id % COLS
    const row = Math.floor(id / COLS) - minRow
    const left = col * tileW
    const top = row * tileH

    const outFile = path.join(OUT_DIR, `${id}_${SUFFIX}.jpg`)
    try {
      await sharp(INPUT_IMAGE)
        .extract({ left, top, width: tileW, height: tileH })
        .jpeg({ quality: 100 })
        .toFile(outFile)
      written++
      if (written % 200 === 0) {
        console.log(`... ${written} / ${ids.length}`)
      }
    } catch (e) {
      console.error(`Failed to write tile ${id}: ${e.message}`)
    }
  }

  console.log(`Done. Written ${written} tiles to ${OUT_DIR}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
