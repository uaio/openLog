// Copy web/dist → cli/public/ for bundling with the published package
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../../web/dist');
const dst = path.resolve(__dirname, '../public');

if (fs.existsSync(src)) {
  fs.cpSync(src, dst, { recursive: true });
  console.log('✅ Copied web/dist → public/');
} else {
  console.warn('⚠️  web/dist not found, skipping copy (run web build first)');
}
