const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(data\.error\) \{\s*return res\.status\(400\)\.json\(\{ error: data\.error \}\);\s*\}\s*res\.json\(\{ success: true, services: data \}\);/g;
const replacement = `if (data.error) {
        return res.status(400).json({ error: data.error });
      }
      
      if (Array.isArray(data)) {
        data = data.map(service => {
          if (service.rate) {
            service.rate = (parseFloat(service.rate) * 1.40).toFixed(4);
          }
          return service;
        });
      }
      
      res.json({ success: true, services: data });`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Replacement done:", code.includes("1.40"));
