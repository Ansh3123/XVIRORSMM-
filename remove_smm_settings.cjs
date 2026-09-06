const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const match = code.match(/function SMMSettings\(\) \{[\s\S]*?\}\n\nexport default function AdminDashboard/);
if (match) {
  code = code.replace(match[0], 'export default function AdminDashboard');
}
code = code.replace(/<SMMSettings \/>/g, '');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Removed SMMSettings.');
