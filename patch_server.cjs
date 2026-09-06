const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix rate parsing in server
const oldRateLogic = `          if (service.rate) {
            service.rate = (parseFloat(service.rate) * 1.40).toFixed(4);
          }`;
const newRateLogic = `          if (service.rate) {
            const cleanRate = String(service.rate).replace(/,/g, '');
            service.rate = (parseFloat(cleanRate) * 1.40).toFixed(4);
          }`;
code = code.replace(oldRateLogic, newRateLogic);

fs.writeFileSync('server.ts', code);
console.log('Server rate logic patched');
