const fs = require('fs');
let code = fs.readFileSync('src/pages/Services.tsx', 'utf8');

const regex = /\/\/ 1\. Fetch from SMM helper[\s\S]*?let finalServices = Object\.values\(mergedServicesMap\);/g;

const replacement = `let finalServices: Service[] = [];
        try {
          finalServices = await fetchSMMServices();
        } catch (apiErr) {
          console.error('Failed to fetch from SMM helper:', apiErr);
        }`;
        
code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/Services.tsx', code);
console.log("Patched Services.tsx");
