import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('Generating white background & black line icons...');
  execSync('node scripts/gen-pwa-icons.mjs', { stdio: 'inherit' });

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

  console.log('Ensuring icons directory in dist...');
  const distIconsDir = path.join('dist', 'icons');
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
  }
  if (fs.existsSync('public/icons')) {
    const iconFiles = fs.readdirSync('public/icons');
    iconFiles.forEach(file => {
      fs.copyFileSync(path.join('public/icons', file), path.join(distIconsDir, file));
    });
    console.log('Icons copied successfully to dist/icons.');
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
