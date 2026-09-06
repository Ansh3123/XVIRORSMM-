const fs = require('fs');
let code = fs.readFileSync('src/pages/NewOrder.tsx', 'utf8');

const regex = /\/\/ 1\. Fetch SMM services via helper[\s\S]*?let finalServices = Object\.values\(mergedServicesMap\);/g;

const replacement = `let finalServices: Service[] = [];
        try {
          finalServices = await fetchSMMServices();
        } catch (apiErr) {
          console.error('Failed to fetch SMM helper services:', apiErr);
        }`;
        
code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/NewOrder.tsx', code);
console.log("Patched NewOrder.tsx");
