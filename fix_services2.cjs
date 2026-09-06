const fs = require('fs');
let code = fs.readFileSync('src/pages/Services.tsx', 'utf8');

code = code.replace(/\{platforms\.map\(p => <option key=\{p\} value=\{p\}>\{p\}<\/option>\)\}/g, '{categories.map(c => <option key={c} value={c}>{c}</option>)}');
code = code.replace(/<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">\{service\.platform\}<\/td>/g, '');
code = code.replace(/<th scope="col" className="px-3 py-3\.5 text-left text-sm font-semibold text-gray-900">Platform<\/th>/g, '');
code = code.replace(/const matchesPlatform = selectedPlatform === 'All' \|\| service\.platform === selectedPlatform;/g, 'const matchesPlatform = true;');

fs.writeFileSync('src/pages/Services.tsx', code);
