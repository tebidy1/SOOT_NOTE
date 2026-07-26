import { Resvg } from '@resvg/resvg-js'
import fs from 'fs'
import path from 'path'

const svgPath = path.resolve('public/icons/icon.svg')
const outDir = path.resolve('public/pwa-icons')
const iconsDir = path.resolve('public/icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

const baseSvg = fs.readFileSync(svgPath, 'utf-8')

// Maskable icon: SoutNote logo centered on a safe-area square of white background.
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
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  <g transform="translate(${inset}, ${inset})">${innerSvg}</g>
</svg>`
}

function render(svg, size, targetPath) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  fs.writeFileSync(targetPath, png)
  console.log('wrote', path.basename(targetPath), png.length, 'bytes')
}

// PWA icons — white background, black lines.
render(baseSvg, 192, path.join(outDir, 'pwa-192x192.png'))
render(baseSvg, 512, path.join(outDir, 'pwa-512x512.png'))
render(baseSvg, 180, path.join(outDir, 'apple-touch-icon-180x180.png'))
render(maskableSvg(512), 512, path.join(outDir, 'maskable-icon-512x512.png'))

// Chrome Extension PNG icons
render(baseSvg, 16, path.join(iconsDir, 'icon-16.png'))
render(baseSvg, 32, path.join(iconsDir, 'icon-32.png'))
render(baseSvg, 48, path.join(iconsDir, 'icon-48.png'))
render(baseSvg, 128, path.join(iconsDir, 'icon-128.png'))

console.log('PWA & Chrome Extension icons generated with white background and black lines.')
