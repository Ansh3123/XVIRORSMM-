const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminServices.tsx', 'utf8');

// I will remove handleSyncAPI completely.
const match = code.match(/const handleSyncAPI = async \(\) => \{[\s\S]*?setIsSyncing\(false\);\n    \}\n  \};/);
if (match) {
  code = code.replace(match[0], '');
}

// I will remove the Sync API button from UI
const btnMatch = code.match(/<button\s+onClick=\{handleSyncAPI\}[\s\S]*?<\/button>/);
if (btnMatch) {
  code = code.replace(btnMatch[0], '');
}

fs.writeFileSync('src/pages/AdminServices.tsx', code);
console.log('Removed handleSyncAPI.');
