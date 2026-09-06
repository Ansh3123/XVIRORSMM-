const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `        console.error("SMM Provider Unreachable or Network Error:", fetchErr);
        return res.status(400).json({
          error: "incorrect service type"
        });`;
const rep1 = `        console.error("SMM Provider Unreachable or Network Error:", fetchErr);
        return res.status(400).json({
          error: fetchErr.message || "SMM Provider Unreachable or Network Error"
        });`;

const target2 = `      } catch (parseErr) {
        console.error(\`[SMM Order Parse Error] Received raw response:\`, responseText.slice(0, 500));
        return res.status(400).json({
           error: "incorrect service type"
         });
      }`;
const rep2 = `      } catch (parseErr) {
        console.error(\`[SMM Order Parse Error] Received raw response:\`, responseText.slice(0, 500));
        return res.status(400).json({
           error: "Invalid JSON response from SMM Provider"
         });
      }`;

const target3 = `      if (data.error) {
         console.warn(\`[SMM Order Provider Rejection]:\`, data.error);
         return res.status(400).json({ error: data.error || "incorrect service type" });
      }
      if (!data.order && !data.success) {
         return res.status(400).json({ error: data.message || "incorrect service type" });
      }`;
const rep3 = `      if (data.error) {
         console.warn(\`[SMM Order Provider Rejection]:\`, data.error);
         return res.status(400).json({ error: data.error || "Provider rejected the order" });
      }
      if (!data.order && !data.success) {
         return res.status(400).json({ error: data.message || "Provider failed to return an order ID" });
      }`;

const target4 = `    } catch (err: any) {
      console.error("SMM API Error:", err);
      res.status(400).json({ error: "incorrect service type" });
    }`;
const rep4 = `    } catch (err: any) {
      console.error("SMM API Error:", err);
      res.status(400).json({ error: err.message || "Internal Server Error during order placement" });
    }`;

code = code.replace(target1, rep1);
code = code.replace(target2, rep2);
code = code.replace(target3, rep3);
code = code.replace(target4, rep4);

fs.writeFileSync('server.ts', code);
console.log("Replaced error messages in server.ts");
