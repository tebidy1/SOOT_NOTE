import { Resvg } from '@resvg/resvg-js'
import fs from 'fs'
import path from 'path'

const svgPath = path.resolve('public/icons/icon.svg')
const outDir = path.resolve('public/pwa-icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const baseSvg = fs.readFileSync(svgPath, 'utf-8')

// Maskable icon: SoutNote logo centered on a safe-area square of the brand color.
// The rounded-corner logo is inset ~15% so it stays inside the 80% safe zone
// enforced by Android's maskable spec.
function maskableSvg(size) {
  const inset = Math.round(size * 0.15)
  const inner = size - inset * 2
  const innerSvg = baseSvg
    .replace(/width="\d+"/, `width="${inner}"`)
    .replace(/height="\d+"/, `height="${inner}"`)
    .replace(/<svg[^>]*>/, m => m + '')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0F172A"/>
  <g transform="translate(${inset}, ${inset})">${innerSvg}</g>
</svg>`
}

function render(svg, size, file) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  fs.writeFileSync(path.join(outDir, file), png)
  console.log('wrote', file, png.length, 'bytes')
}

// Regular (non-maskable) icons — logo edge-to-edge.
render(baseSvg, 192, 'pwa-192x192.png')
render(baseSvg, 512, 'pwa-512x512.png')
render(baseSvg, 180, 'apple-touch-icon-180x180.png')

// Maskable variant with padded safe area on brand background.
render(maskableSvg(512), 512, 'maskable-icon-512x512.png')

console.log('PWA icons generated in', outDir)
