const fs = require('fs');

const files = ['src/pages/Services.tsx', 'src/pages/NewOrder.tsx'];
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/if \(!isAdmin\) \{\s*finalServices = finalServices\.filter\(s => s\.status === 'active'\);\s*\}/g, "");
  fs.writeFileSync(file, code);
}
console.log('Removed active filter');
