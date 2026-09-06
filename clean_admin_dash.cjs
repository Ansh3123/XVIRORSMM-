const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Remove SMMConfigPanel completely.
const match = code.match(/function SMMConfigPanel\(\) \{[\s\S]*?\}\s*export default function AdminDashboard/);
if (match) {
  code = code.replace(match[0], 'export default function AdminDashboard');
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
  console.log('Removed SMMConfigPanel definition.');
} else {
  console.log('SMMConfigPanel not found or already removed.');
}
