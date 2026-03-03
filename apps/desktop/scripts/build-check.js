const fs = require('fs');
const path = require('path');
const required = [
  'src/main.js',
  'src/preload.js',
  'src/ui/index.html',
  'src/ui/renderer.js'
];
for (const file of required) {
  const full = path.join(__dirname, '..', file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing required build artifact input: ${file}`);
  }
}
console.log('build: validation passed (MVP skeleton ready for packaging)');
