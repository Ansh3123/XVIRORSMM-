const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminServices.tsx', 'utf8');

const regex = /\/\/ 1\. Fetch from SMM helper[\s\S]*?setServices\(Object\.values\(mergedServicesMap\)\);/g;

const replacement = `let finalServices: Service[] = [];
      try {
        finalServices = await fetchSMMServices();
      } catch (apiErr) {
        console.error('Failed to fetch from SMM helper:', apiErr);
      }
      setServices(finalServices);`;
        
code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/AdminServices.tsx', code);
console.log("Patched AdminServices.tsx");
