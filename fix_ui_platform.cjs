const fs = require('fs');

// Fix NewOrder.tsx
let newOrder = fs.readFileSync('src/pages/NewOrder.tsx', 'utf8');
newOrder = newOrder.replace(/const \[platforms, setPlatforms\] = useState<string\[\]>\(\[\]\);\n\s*const \[selectedPlatform, setSelectedPlatform\] = useState\(''\);\n/g, "");
newOrder = newOrder.replace(/const platformServices = services\.filter\(s => s\.platform === selectedPlatform\);\n\s*const uniqueCategories = Array\.from\(new Set\(platformServices\.map\(s => s\.category\)\)\);/g, "const uniqueCategories = Array.from(new Set(services.map(s => s.category)));");
newOrder = newOrder.replace(/if \(srv && srv\.platform === selectedPlatform\) \{/g, "if (srv) {");
newOrder = newOrder.replace(/<div>\s*<label className="block text-sm font-medium text-gray-700">Platform<\/label>[\s\S]*?<\/select>\s*<\/div>/, "");
newOrder = newOrder.replace(/selectedPlatform/g, "true"); // Fallbacks for remaining
fs.writeFileSync('src/pages/NewOrder.tsx', newOrder);

// Fix Services.tsx
let servicesUI = fs.readFileSync('src/pages/Services.tsx', 'utf8');
servicesUI = servicesUI.replace(/const \[selectedPlatform, setSelectedPlatform\] = useState\('All'\);/g, "");
servicesUI = servicesUI.replace(/const platforms = \['All', \.\.\.Array\.from\(new Set\(services\.map\(s => s\.platform\)\)\)\];/g, "");
servicesUI = servicesUI.replace(/<div className="flex space-x-2 overflow-x-auto pb-2">[\s\S]*?<\/div>\s*<\/div>/, "");
servicesUI = servicesUI.replace(/const filteredServices = services\.filter\(s =>\s*\(selectedPlatform === 'All' \|\| s\.platform === selectedPlatform\) &&/g, "const filteredServices = services.filter(s =>");
servicesUI = servicesUI.replace(/<span className="inline-flex items-center px-2\.5 py-0\.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">\s*\{service\.platform\}\s*<\/span>/, "");
fs.writeFileSync('src/pages/Services.tsx', servicesUI);

console.log("Removed platform filter from UI");
