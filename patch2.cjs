const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSync = `
      if (data.error) {
        return res.status(400).json({ error: data.error });
      }
      res.json({ success: true, services: data });
`;
const newSync = `
      if (data.error) {
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
      res.json({ success: true, services: data });
`;
code = code.replace(oldSync, newSync);
fs.writeFileSync('server.ts', code);
