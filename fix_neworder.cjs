const fs = require('fs');

let code = fs.readFileSync('src/pages/NewOrder.tsx', 'utf8');
code = code.replace(/const \[true, setSelectedPlatform\] = useState\(''\);\n/g, "");
// wait, I replaced ALL selectedPlatform with true!
// Let's restore the original from git or from my previous task.
