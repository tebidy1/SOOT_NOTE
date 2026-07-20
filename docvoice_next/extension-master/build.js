import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('Building with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('Copying manifest.json...');
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  if (fs.existsSync('public/animation.json')) {
    fs.copyFileSync('public/animation.json', 'dist/animation.json');
  }

  console.log('Fixing paths in dist/index.html...');
  const indexPath = path.join('dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8');
    html = html.replace(/src="\/popup\/index\.js"/g, 'src="./popup/index.js"');
    html = html.replace(/href="\/assets\/index/g, 'href="./assets/index');
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('Paths fixed successfully.');
  }

  console.log('Copying icons...');
  const iconsDir = path.join('dist', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  if (fs.existsSync('public/icons/icon.svg')) {
    fs.copyFileSync('public/icons/icon.svg', path.join(iconsDir, 'icon.svg'));
    console.log('icon.svg copied successfully.');
  }
  // Create placeholders for success/error/info pngs just in case they are used
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(base64Png, 'base64');
  const notifications = ['success.png', 'error.png', 'info.png', 'icon16.png', 'icon48.png', 'icon128.png'];
  notifications.forEach(icon => {
    fs.writeFileSync(path.join(iconsDir, icon), pngBuffer);
  });
  console.log('Icons and placeholders processed.');

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
