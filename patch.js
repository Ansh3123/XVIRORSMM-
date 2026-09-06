const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const oldFunc = `async function getSmmConfig() {
  try {
    const configDoc = await dbAdmin.collection("settings").doc("smm").get();
    if (configDoc.exists) {
      const data = configDoc.data();
      if (data && data.apiKey && data.apiUrl) {
        return {
          apiKey: String(data.apiKey).trim(),
          apiUrl: String(data.apiUrl).trim()
        };
      }
    }
  } catch (err) {
    console.error("Error reading dynamic SMM config from Firestore settings/smm document:", err);
  }
  // Standard Default values requested for now:
  return {
    apiKey: "2faaf3ae79aa75071f6ac95727f141c0",
    apiUrl: "https://smmupi.com/api/v2"
  };
}`;
const newFunc = `async function getSmmConfig() {
  return {
    apiKey: "a6e020a26b2a0a54cf2ec9d35ad096e5",
    apiUrl: "https://smmupi.com/api/v2"
  };
}`;
code = code.replace(oldFunc, newFunc);
fs.writeFileSync('server.ts', code);
