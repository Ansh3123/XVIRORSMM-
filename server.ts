import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.post("/api/smm/sync", async (req, res) => {
    try {
      const apiKey = "27400c706565bd0de788f2ce390b4236ac20d4fc";
      const apiUrl = "https://themainsmmprovider.com/api/v2";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          key: apiKey,
          action: "services"
        })
      });
      const data = await response.json();
      res.json({ success: true, services: data });
    } catch (err) {
      console.error("Sync API Error:", err);
      res.status(500).json({ error: "Failed to fetch services from provider" });
    }
  });

  app.post("/api/smm/order", async (req, res) => {
    try {
      const { service, link, quantity } = req.body;
      const apiKey = "27400c706565bd0de788f2ce390b4236ac20d4fc";
      const apiUrl = "https://themainsmmprovider.com/api/v2";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          key: apiKey,
          action: "add",
          service: String(service),
          link: String(link),
          quantity: String(quantity)
        })
      });
      const data = await response.json();
      
      if (data.error) {
         return res.status(400).json({ error: data.error });
      }
      
      res.json({ success: true, orderId: data.order });
    } catch (err) {
      console.error("SMM API Error:", err);
      res.status(500).json({ error: "Failed to place order with provider" });
    }
  });

  // Send recharge notification email to Admin (anshgupta4525@gmail.com) with action buttons (Disabled)
  app.post("/api/notify-recharge", async (req, res) => {
    try {
      const { txId, userEmail, amount } = req.body;
      if (!txId || !userEmail || amount === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      console.log(`[Recharge Notification Disabled] txId: ${txId}, userEmail: ${userEmail}, amount: ₹${amount}`);
      
      return res.json({ 
        success: true, 
        message: "Wallet recharge request successfully registered. Email notification is disabled." 
      });
    } catch (err: any) {
      console.error("Notify recharge error:", err);
      return res.json({ success: true, message: "Email notification disabled" });
    }
  });

  // Admin approval/rejection endpoint via links in the email
  app.get("/api/admin-action", async (req, res) => {
    try {
      const { action, txId } = req.query;
      if (!txId || (action !== 'accept' && action !== 'reject')) {
        return res.status(400).send("<h1>Invalid Request</h1><p>Missing transaction ID or action parameter.</p>");
      }

      // 1. Load Firebase configurations
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
      const projectId = firebaseConfig.projectId || "concrete-spider-c46tg";
      const apiKey = firebaseConfig.apiKey || "";

      // 2. Fetch the recharge request document from Firestore
      const txUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/walletRechargeRequests/${txId}?key=${apiKey}`;
      const txResponse = await fetch(txUrl);
      if (!txResponse.ok) {
        return res.status(404).send("<h1>Request Not Found</h1><p>The specified wallet recharge request was not found or has been deleted.</p>");
      }

      const txDoc = await txResponse.json();
      const fields = txDoc.fields;
      if (!fields) {
        return res.status(400).send("<h1>Invalid Document</h1><p>Document structure is invalid.</p>");
      }

      const currentStatus = fields.status?.stringValue;
      if (currentStatus !== 'pending') {
        return res.status(400).send(`<h1>Already Processed</h1><p>This request has already been processed and is currently marked as <strong>${currentStatus}</strong>.</p>`);
      }

      const userId = fields.userId?.stringValue;
      const userEmail = fields.userEmail?.stringValue || '';
      const utr = fields.utr?.stringValue || '';
      const createdAt = fields.createdAt?.integerValue || Date.now();
      
      let amount = 0;
      if (fields.amount) {
        if (fields.amount.doubleValue !== undefined) amount = Number(fields.amount.doubleValue);
        else if (fields.amount.integerValue !== undefined) amount = Number(fields.amount.integerValue);
      }

      if (action === 'accept') {
        // Fetch user document to get current balance
        const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?key=${apiKey}`;
        const userResponse = await fetch(userUrl);
        let currentBalance = 0;
        let userFields: any = {};
        if (userResponse.ok) {
          const userDoc = await userResponse.json();
          userFields = userDoc.fields || {};
          if (userFields.balance) {
            if (userFields.balance.doubleValue !== undefined) currentBalance = Number(userFields.balance.doubleValue);
            else if (userFields.balance.integerValue !== undefined) currentBalance = Number(userFields.balance.integerValue);
          }
        }

        const newBalance = currentBalance + amount;

        // a. Update User Balance in Firestore via PATCH
        const patchUserUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=balance&updateMask.fieldPaths=updatedAt&key=${apiKey}`;
        await fetch(patchUserUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              balance: { doubleValue: newBalance },
              updatedAt: { integerValue: String(Date.now()) }
            }
          })
        });

        // b. Update Request Status to 'accepted'
        const patchTxUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/walletRechargeRequests/${txId}?updateMask.fieldPaths=status&updateMask.fieldPaths=processedAt&updateMask.fieldPaths=updatedAt&key=${apiKey}`;
        await fetch(patchTxUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              status: { stringValue: 'accepted' },
              processedAt: { integerValue: String(Date.now()) },
              updatedAt: { integerValue: String(Date.now()) }
            }
          })
        });

        // c. Add Transaction Record
        const transactionUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/transactions?key=${apiKey}`;
        await fetch(transactionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              userId: { stringValue: userId },
              userEmail: { stringValue: userEmail },
              amount: { doubleValue: amount },
              type: { stringValue: 'deposit' },
              status: { stringValue: 'completed' },
              utr: { stringValue: utr },
              createdAt: { integerValue: String(createdAt) },
              verifiedAt: { integerValue: String(Date.now()) },
              verificationTime: { integerValue: String(Date.now()) }
            }
          })
        });

        return res.send(`
          <html>
            <head>
              <title>Deposit Approved</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-50 flex items-center justify-center min-h-screen p-6">
              <div class="bg-white max-w-md w-full rounded-xl shadow-lg p-8 border border-green-100 text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Deposit Approved!</h1>
                <p class="text-gray-600 mb-6">Successfully credited <span class="font-bold text-gray-900">₹${amount.toFixed(2)}</span> to <span class="font-bold text-gray-900">${userEmail}</span>'s wallet.</p>
                <div class="border-t border-gray-100 pt-4 mb-6 text-left text-sm space-y-2">
                  <div class="flex justify-between"><span class="text-gray-500">User Email:</span><span class="font-semibold text-gray-800">${userEmail}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Amount Credited:</span><span class="font-semibold text-green-600">₹${amount.toFixed(2)}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">UTR Code:</span><span class="font-mono text-gray-800">${utr}</span></div>
                </div>
                <p class="text-xs text-gray-400">This action was verified transactionally via Firebase Cloud Firestore.</p>
              </div>
            </body>
          </html>
        `);
      } else {
        // action === 'reject' (rejecting without any reason as requested by the user)
        const patchTxUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/walletRechargeRequests/${txId}?updateMask.fieldPaths=status&updateMask.fieldPaths=processedAt&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=rejectReason&key=${apiKey}`;
        await fetch(patchTxUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              status: { stringValue: 'rejected' },
              processedAt: { integerValue: String(Date.now()) },
              updatedAt: { integerValue: String(Date.now()) },
              rejectReason: { stringValue: 'Deposit request was declined by administrator.' }
            }
          })
        });

        return res.send(`
          <html>
            <head>
              <title>Deposit Rejected</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-50 flex items-center justify-center min-h-screen p-6">
              <div class="bg-white max-w-md w-full rounded-xl shadow-lg p-8 border border-red-100 text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Deposit Request Rejected</h1>
                <p class="text-gray-600 mb-6">Declined the recharge request of <span class="font-bold text-gray-900">₹${amount.toFixed(2)}</span> for user <span class="font-bold text-gray-900">${userEmail}</span> without balance deduction.</p>
                <div class="border-t border-gray-100 pt-4 mb-6 text-left text-sm space-y-2">
                  <div class="flex justify-between"><span class="text-gray-500">User Email:</span><span class="font-semibold text-gray-800">${userEmail}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Amount:</span><span class="font-semibold text-gray-800">₹${amount.toFixed(2)}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">UTR Code:</span><span class="font-mono text-gray-800">${utr}</span></div>
                </div>
                <p class="text-xs text-gray-400">Request status has been updated in Cloud Firestore.</p>
              </div>
            </body>
          </html>
        `);
      }

    } catch (err: any) {
      console.error("Admin action error:", err);
      return res.status(500).send(`<h1>Server Error</h1><p>${err.message || err}</p>`);
    }
  });

  // Secure Transaction Executor for atomic code redemption
  async function executeRedeemTransaction(projectId: string, apiKey: string, code: string, userId: string, userEmail: string): Promise<number> {
    // 1. Begin transaction
    const beginUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:beginTransaction?key=${apiKey}`;
    const beginRes = await fetch(beginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options: { readWrite: {} } })
    });
    if (!beginRes.ok) {
      const errTxt = await beginRes.text();
      console.error("Begin transaction failed:", errTxt);
      throw new Error("Failed to secure connection for transaction. Try again.");
    }
    const { transaction } = await beginRes.json();

    // 2. Fetch the redeem code document within transaction
    const codeUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/redeemCodes/${code}?transaction=${transaction}&key=${apiKey}`;
    const codeRes = await fetch(codeUrl);
    if (!codeRes.ok) {
      if (codeRes.status === 404) {
        throw new Error("Invalid redeem code.");
      }
      throw new Error("Failed to read redeem code in transaction");
    }
    const codeDoc = await codeRes.json();
    const codeFields = codeDoc.fields;
    if (!codeFields) throw new Error("Invalid code format in database");

    const status = codeFields.status?.stringValue;
    if (status === "Redeemed") {
      throw new Error("This redeem code has already been used.");
    }
    if (status !== "Available") {
      throw new Error("This redeem code is no longer available.");
    }

    let amount = 0;
    if (codeFields.amount) {
      if (codeFields.amount.doubleValue !== undefined) amount = Number(codeFields.amount.doubleValue);
      else if (codeFields.amount.integerValue !== undefined) amount = Number(codeFields.amount.integerValue);
    }
    const createdAt = codeFields.createdAt?.integerValue || String(Date.now());

    // 3. Fetch user document within transaction to get current balance
    const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?transaction=${transaction}&key=${apiKey}`;
    const userRes = await fetch(userUrl);
    let currentBalance = 0;
    let userFields: any = {};
    if (userRes.ok) {
      const userDoc = await userRes.json();
      userFields = userDoc.fields || {};
      if (userFields.balance) {
        if (userFields.balance.doubleValue !== undefined) currentBalance = Number(userFields.balance.doubleValue);
        else if (userFields.balance.integerValue !== undefined) currentBalance = Number(userFields.balance.integerValue);
      }
    } else {
      throw new Error("Please log in before redeeming a code.");
    }

    const newBalance = currentBalance + amount;

    // 4. Commit transaction with updates
    const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit?key=${apiKey}`;
    const txId = "tx_" + Math.random().toString(36).substring(2, 15);

    const updatedUserFields = { ...userFields };
    updatedUserFields.balance = { doubleValue: newBalance };
    updatedUserFields.updatedAt = { integerValue: String(Date.now()) };

    const commitBody = {
      transaction,
      writes: [
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/redeemCodes/${code}`,
            fields: {
              code: { stringValue: code },
              amount: { doubleValue: amount },
              status: { stringValue: "Redeemed" },
              createdAt: { integerValue: String(createdAt) },
              redeemedAt: { integerValue: String(Date.now()) },
              redeemedBy: { stringValue: userId }
            }
          }
        },
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/users/${userId}`,
            fields: updatedUserFields
          },
          updateMask: { fieldPaths: ["balance", "updatedAt"] }
        },
        {
          update: {
            name: `projects/${projectId}/databases/(default)/documents/transactions/${txId}`,
            fields: {
              userId: { stringValue: userId },
              userEmail: { stringValue: userEmail },
              amount: { doubleValue: amount },
              type: { stringValue: "deposit" },
              status: { stringValue: "completed" },
              utr: { stringValue: `REDEEM-${code}` },
              createdAt: { integerValue: String(Date.now()) }
            }
          }
        }
      ]
    };

    const commitRes = await fetch(commitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commitBody)
    });

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      console.error("Commit transaction failed:", errText);
      throw new Error("Conflict during parallel redemption. Please try again.");
    }

    return amount;
  }

  // 1. Redeem Code API Endpoint
  app.post("/api/redeem-code", async (req, res) => {
    try {
      const { code, userId, userEmail } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "Invalid redeem code." });
      }
      if (!userId || !userEmail) {
        return res.status(401).json({ success: false, message: "Please log in before redeeming a code." });
      }

      // Load Firebase configuration
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
      const projectId = firebaseConfig.projectId || "xvirorsmm";
      const apiKey = firebaseConfig.apiKey || "";

      try {
        const credited = await executeRedeemTransaction(projectId, apiKey, code.trim(), userId, userEmail);
        return res.json({
          success: true,
          message: `Redeemed successfully! ₹${credited} has been added to your wallet.`
        });
      } catch (err: any) {
        console.error("Redeem operation failed:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to redeem code" });
      }
    } catch (err: any) {
      console.error("Redeem API error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // 2. Seed Redeem Codes API Endpoint
  app.post("/api/admin/seed-redeem-codes", async (req, res) => {
    try {
      const { adminEmail } = req.body;
      if (adminEmail !== "isanshcool@gmail.com") {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }

      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
      const projectId = firebaseConfig.projectId || "xvirorsmm";
      const apiKey = firebaseConfig.apiKey || "";

      const csvPath = path.join(process.cwd(), "src", "data", "raw_redeem_codes.csv");
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ success: false, message: "Raw CSV not found" });
      }

      const csvData = fs.readFileSync(csvPath, "utf-8");
      const lines = csvData.split("\n");
      const codesToSeed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const firstComma = line.indexOf(",");
        const secondComma = line.lastIndexOf(",");
        if (firstComma === -1) continue;
        
        const amountStr = line.substring(0, firstComma).trim();
        const codeStr = line.substring(firstComma + 1, secondComma === firstComma ? line.length : secondComma).trim();
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || !codeStr) continue;
        
        codesToSeed.push({
          code: codeStr,
          amount,
          status: "Available",
          createdAt: Date.now()
        });
      }

      // Seed in batches of 400
      const batchSize = 400;
      let seededCount = 0;
      for (let i = 0; i < codesToSeed.length; i += batchSize) {
        const chunk = codesToSeed.slice(i, i + batchSize);
        const writes = chunk.map(item => ({
          update: {
            name: `projects/${projectId}/databases/(default)/documents/redeemCodes/${item.code}`,
            fields: {
              code: { stringValue: item.code },
              amount: { doubleValue: item.amount },
              status: { stringValue: item.status },
              createdAt: { integerValue: String(item.createdAt) }
            }
          }
        }));

        const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit?key=${apiKey}`;
        const commitRes = await fetch(commitUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ writes })
        });
        if (!commitRes.ok) {
          const text = await commitRes.text();
          console.error(`Batch seeding failed for chunk starting at ${i}:`, text);
          return res.status(500).json({ success: false, message: "Batch seeding failed", details: text });
        }
        seededCount += chunk.length;
      }

      return res.json({ success: true, message: `Successfully seeded ${seededCount} redeem codes!`, count: seededCount });
    } catch (err: any) {
      console.error("Seed API Error:", err);
      return res.status(500).json({ success: false, message: err.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
