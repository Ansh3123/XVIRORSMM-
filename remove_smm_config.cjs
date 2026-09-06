const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// I will remove the SMMConfigPanel component rendering.
const replacement = code.replace(/<SMMConfigPanel \/>/g, '');
fs.writeFileSync('src/pages/AdminDashboard.tsx', replacement);

