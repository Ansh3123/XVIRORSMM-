const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The place where it checks responseText in order
// I'll make sure it handles JSON parsing gracefully
const regex = /data = JSON\.parse\(responseText\);\n      \} catch \(parseErr\) \{[\s\S]*?return res\.status\(400\)\.json\(\{[\s\S]*?error: "Invalid JSON response from SMM Provider"[\s\S]*?\}\);\n      \}/;

const replacement = `data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("[SMM Order Parse Error] Received raw response:", responseText.slice(0, 500));
        return res.status(502).json({
          error: "Provider API returned an invalid response (not JSON)."
        });
      }`;

if (code.match(regex)) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('server.ts', code);
   console.log('Order API patched for better error messages');
} else {
   console.log('Order API regex did not match, leaving as is');
}

