import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

const extensionPlugin = () => {
  return {
    name: 'extension-plugin',
    writeBundle() {
      const manifestPath = resolve(__dirname, 'manifest.json')
      const distManifestPath = resolve(__dirname, 'dist/manifest.json')
      if (fs.existsSync(manifestPath)) {
        fs.copyFileSync(manifestPath, distManifestPath)
      }
      
      const indexPath = resolve(__dirname, 'dist/index.html')
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8')
        html = html.replace(/src="\/popup\/index\.js"/g, 'src="./popup/index.js"')
        html = html.replace(/href="\/assets\/index/g, 'href="./assets/index')
        fs.writeFileSync(indexPath, html, 'utf-8')
      }

      const iconsDir = resolve(__dirname, 'dist/public/icons')
      if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true })
      }
      const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      const pngBuffer = Buffer.from(base64Png, 'base64')
      const icons = ['icon16.png', 'icon48.png', 'icon128.png', 'success.png', 'error.png', 'info.png']
      icons.forEach(icon => {
        fs.writeFileSync(path.join(iconsDir, icon), pngBuffer)
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), extensionPlugin()],
  root: resolve(__dirname, 'src/popup'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts')
      },
      output: {
        entryFileNames: '[name]/index.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})