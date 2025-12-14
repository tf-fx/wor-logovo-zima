// Generate winterized tiles from original_images to zima1 and build a minimap
// Usage: node scripts/generate-winter.js [--tile=16]

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '.')
console.log(ROOT)
const SRC_DIR = path.join(ROOT, 'original_images')
const OUT_DIR = path.join(ROOT, 'zima1')
const MINI_DIR = path.join(ROOT, 'mini_maps')

const SUFFIX = 'l11sd2'
const COLS = 33
const TILE_SIZE = Number((process.argv.find(a => a.startsWith('--tile=')) || '').split('=')[1]) || 16

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true })
}

function parseIdFromName(filename) {
    // Expecting pattern: <id>_<suffix>.jpg
    const name = path.basename(filename)
    const [idStr, suffixWithExt] = name.split('_')
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

async function buildMiniMap(files) {
    if (!files.length) return

    // Determine bounds based on IDs
    const ids = files
        .map(f => parseIdFromName(f))
        .filter(id => id !== null)
        .sort((a, b) => a - b)
    if (!ids.length) return

    const rows = ids.map(id => Math.floor(id / COLS))
    const minRow = Math.min(...rows)
    const maxRow = Math.max(...rows)
    const rowCount = maxRow - minRow + 1

    const width = COLS * TILE_SIZE
    const height = rowCount * TILE_SIZE

    console.log(`Building minimap: ${COLS} cols x ${rowCount} rows -> ${width}x${height}`)

    // Prepare composite parts
    const composites = []
    for (const id of ids) {
        const col = id % COLS
        const row = Math.floor(id / COLS) - minRow
        const file = path.join(OUT_DIR, `${id}_${SUFFIX}.jpg`)

        try {
            const buf = await sharp(file).resize(TILE_SIZE, TILE_SIZE, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer()
            composites.push({ input: buf, left: col * TILE_SIZE, top: row * TILE_SIZE })
        } catch (e) {
            // Missing tile in output; skip
            // console.warn(`Skip missing tile for id=${id}`)
        }
    }

    await ensureDir(MINI_DIR)
    const outFile = path.join(MINI_DIR, `map11_zima1.jpg`)

    // Create base canvas (slightly cool background)
    const base = sharp({
        create: {
            width,
            height,
            channels: 3,
            background: { r: 10, g: 20, b: 30 }
        }
    })

    await base.composite(composites).jpeg({ quality: 80 }).toFile(outFile)
    console.log(`Minimap written: ${outFile}`)
}

// Build a FULL-SIZE stitched map from original tiles (no downscaling)
async function buildFullMap(files) {
    if (!files.length) return

    // Determine bounds based on IDs
    const ids = files
        .map(f => parseIdFromName(f))
        .filter(id => id !== null)
        .sort((a, b) => a - b)
    if (!ids.length) return

    // Detect tile dimensions from the first existing source image
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
        return
    }

    const rows = ids.map(id => Math.floor(id / COLS))
    const minRow = Math.min(...rows)
    const maxRow = Math.max(...rows)
    const rowCount = maxRow - minRow + 1

    const width = COLS * tileW
    const height = rowCount * tileH

    console.log(`Building FULL map: ${COLS} cols x ${rowCount} rows -> ${width}x${height} (tile ${tileW}x${tileH})`)

    const composites = []
    for (const id of ids) {
        const col = id % COLS
        const row = Math.floor(id / COLS) - minRow
        const file = path.join(SRC_DIR, `${id}_${SUFFIX}.jpg`)
        try {
            // Pass file path directly; no resizing
            composites.push({ input: file, left: col * tileW, top: row * tileH })
        } catch (e) {
            // skip missing/broken tile
        }
    }

    const outFile = path.join(ROOT, 'map11_large.jpg')

    // Create base canvas
    const base = sharp({
        create: {
            width,
            height,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
        }
    })

    await base.composite(composites).jpeg({ quality: 90 }).toFile(outFile)
    console.log(`FULL map written: ${outFile}`)
}

async function main() {
    const files = await listSourceFiles()
    if (!files.length) {
        console.error(`No source files found in ${SRC_DIR} for suffix ${SUFFIX}`)
        process.exit(1)
    }
    console.log(`Found ${files.length} source tiles`)

    // Build full-size map in project root
    await buildFullMap(files)

    await buildMiniMap(files)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})

