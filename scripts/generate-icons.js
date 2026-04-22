const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const publicDir = path.join(__dirname, '../public');
  const logoPath = path.join(publicDir, 'logo.png');

  if (!fs.existsSync(logoPath)) {
    console.error('logo.png not found in public directory');
    return;
  }

  const sizes = [
    { name: 'favicon.ico', size: 64 }, // using png but named as ico
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 }
  ];

  for (const { name, size } of sizes) {
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name}`);
  }
}

generateIcons().catch(console.error);
