const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminServices.tsx', 'utf8');
code = code.replace(/<div className="mb-4">\s*<label className="block text-sm font-medium text-gray-700">Platform<\/label>[\s\S]*?<\/div>/, '');
code = code.replace(/<td className="px-3 py-4 text-sm text-gray-900">\{service\.platform\} - \{service\.name\}<\/td>/g, '<td className="px-3 py-4 text-sm text-gray-900">{service.name}</td>');
code = code.replace(/platform: '',/g, '');
code = code.replace(/platform: currentService\.platform,/g, '');

fs.writeFileSync('src/pages/AdminServices.tsx', code);
console.log('Fixed AdminServices.tsx');
