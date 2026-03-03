const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
let failed = false;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && entry.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('TODO')) {
        console.error(`TODO found in ${full}`);
        failed = true;
      }
    }
  }
}

walk(root);
if (failed) process.exit(1);
console.log('lint: passed');
