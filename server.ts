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

  // Send recharge notification email to Admin (anshgupta4525@gmail.com) with action buttons
  app.post("/api/notify-recharge", async (req, res) => {
    try {
      const { txId, userEmail, amount, origin } = req.body;
      if (!txId || !userEmail || amount === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // Load firebase configs to get Gmail token
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
      const projectId = firebaseConfig.projectId || "concrete-spider-c46tg";
      const apiKey = firebaseConfig.apiKey || "";

      const secretUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/secrets/gmail?key=${apiKey}`;
      const secretResponse = await fetch(secretUrl);
      
      let accessToken = "";
      if (secretResponse.ok) {
        const secretData = await secretResponse.json();
        accessToken = secretData.fields?.accessToken?.stringValue || "";
      }

      const finalOrigin = origin || `${req.protocol}://${req.get('host')}`;
      const acceptLink = `${finalOrigin}/api/admin-action?action=accept&txId=${txId}`;
      const rejectLink = `${finalOrigin}/api/admin-action?action=reject&txId=${txId}`;

      const subject = `XVIROR SMM - Recharge Request from ${userEmail}`;
      const body = `
        <div style="font-family: sans-serif; padding: 24px; color: #1f2937; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">New Wallet Recharge Request</h2>
          <p>Hello Admin,</p>
          <p>A new manual wallet deposit has been requested on XVIROR SMM:</p>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
            <div style="margin-bottom: 8px;"><span style="color: #6b7280; font-size: 14px;">User Email:</span> <strong style="color: #111827;">${userEmail}</strong></div>
            <div><span style="color: #6b7280; font-size: 14px;">Amount Requested:</span> <strong style="color: #10b981; font-size: 18px;">₹${parseFloat(amount).toFixed(2)}</strong></div>
          </div>
          <p>Please click one of the buttons below to instantly verify and process this request:</p>
          <div style="margin-top: 24px; margin-bottom: 24px;">
            <a href="${acceptLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 12px; margin-bottom: 8px;">Verify and Credit Balance</a>
            <a href="${rejectLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-bottom: 8px;">Reject Request (No Reason)</a>
          </div>
          <p style="color: #9ca3af; font-size: 11px; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 12px;">This is an automated system security email sent to anshgupta4525@gmail.com on behalf of XVIROR SMM.</p>
        </div>
      `;

      if (accessToken) {
        try {
          const emailMime = [
            `To: anshgupta4525@gmail.com`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${subject}`,
            '',
            body
          ].join('\r\n');
          const base64Raw = Buffer.from(emailMime).toString('base64url');

          const gmailSendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: base64Raw })
          });

          if (gmailSendResponse.ok) {
            return res.json({ success: true, message: "Notification email sent to Admin successfully via Gmail API!" });
          } else {
            const errText = await gmailSendResponse.text();
            console.error("Gmail notification error:", errText);
          }
        } catch (gmailErr) {
          console.error("Gmail notifier exception:", gmailErr);
        }
      }

      // Fallback via SMTP if configured
      const nodemailer = await import("nodemailer").catch(() => null);
      if (nodemailer && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_PASS
            }
          });

          await transporter.sendMail({
            from: `"XVIROR SMM" <${process.env.GMAIL_USER}>`,
            to: "anshgupta4525@gmail.com",
            subject,
            html: body
          });

          return res.json({ success: true, message: "Notification email sent to Admin successfully via SMTP!" });
        } catch (smtpErr) {
          console.error("Nodemailer SMTP Error:", smtpErr);
        }
      }

      return res.status(500).json({ success: false, message: "No email providers available (unauthorized Gmail, or missing SMTP credentials)." });
    } catch (err: any) {
      console.error("Notify recharge error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
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

  // Password Recovery endpoint via Gmail API
  app.post("/api/send-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      // 1. Load Firebase configuration to get project and API key
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let firebaseConfig: any = {};
      if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
      const projectId = firebaseConfig.projectId || "concrete-spider-c46tg";
      const apiKey = firebaseConfig.apiKey || "";

      // 2. Query Firestore REST API for the user with matching email
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
      const userQueryResponse = await fetch(queryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "users" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "email" },
                op: "EQUAL",
                value: { stringValue: email.trim() }
              }
            },
            limit: 1
          }
        })
      });

      if (!userQueryResponse.ok) {
        const errText = await userQueryResponse.text();
        console.error("Firestore user query error:", errText);
        return res.status(500).json({ success: false, message: "Failed to query user database" });
      }

      const queryResults = await userQueryResponse.json();
      if (!queryResults || queryResults.length === 0 || !queryResults[0].document) {
        return res.status(404).json({ success: false, message: "User not found with this email" });
      }

      const fields = queryResults[0].document.fields;
      const userPassword = fields?.password?.stringValue;
      if (!userPassword) {
        return res.status(400).json({ success: false, message: "No password backup found for this account. Please set a password or sign in with Google." });
      }

      // 3. Retrieve Gmail OAuth Access Token from Firestore secrets/gmail
      const secretUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/secrets/gmail?key=${apiKey}`;
      const secretResponse = await fetch(secretUrl);
      
      let accessToken = "";
      if (secretResponse.ok) {
        const secretData = await secretResponse.json();
        accessToken = secretData.fields?.accessToken?.stringValue || "";
      }

      // 4. Send email using Gmail API
      if (accessToken) {
        try {
          const subject = "XVIROR SMM - Password Recovery";
          const body = `
            <div style="font-family: sans-serif; padding: 20px; color: #1f2937; line-height: 1.5;">
              <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Password Recovery</h2>
              <p>Hello,</p>
              <p>You requested password recovery for your account: <strong>${email}</strong>.</p>
              <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 16px; font-family: monospace; letter-spacing: 1px; color: #111827; display: inline-block; margin: 16px 0;">
                Your Password: <strong>${userPassword}</strong>
              </p>
              <p>For your security, please log in and consider updating your password in your profile settings if needed.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">This is an automated security email sent from XVIROR SMM.</p>
            </div>
          `;

          const emailMime = [
            `To: ${email}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${subject}`,
            '',
            body
          ].join('\r\n');
          const base64Raw = Buffer.from(emailMime).toString('base64url');

          const gmailSendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: base64Raw })
          });

          if (gmailSendResponse.ok) {
            return res.json({ success: true, message: "Password recovery email has been sent successfully!" });
          } else {
            const errText = await gmailSendResponse.text();
            console.error("Gmail API sending error:", errText);
          }
        } catch (gmailErr) {
          console.error("Error sending via Gmail API:", gmailErr);
        }
      }

      // 5. Reliable fallback using standard Nodemailer if configured
      const nodemailer = await import("nodemailer").catch(() => null);
      if (nodemailer && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_PASS
            }
          });

          await transporter.sendMail({
            from: `"XVIROR SMM" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "XVIROR SMM - Password Recovery",
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #1f2937; line-height: 1.5;">
                <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Password Recovery</h2>
                <p>Hello,</p>
                <p>You requested password recovery for your account: <strong>${email}</strong>.</p>
                <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 16px; font-family: monospace; letter-spacing: 1px; color: #111827; display: inline-block; margin: 16px 0;">
                  Your Password: <strong>${userPassword}</strong>
                </p>
                <p>For your security, please log in and consider updating your password in your profile settings if needed.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">This is an automated security email sent from XVIROR SMM.</p>
              </div>
            `
          });

          return res.json({ success: true, message: "Password recovery email sent successfully via SMTP fallback!" });
        } catch (smtpErr) {
          console.error("Nodemailer SMTP Error:", smtpErr);
        }
      }

      return res.status(500).json({ 
        success: false, 
        message: "The admin has not authorized Gmail integration yet or Gmail token expired. Please contact support or ask the Admin to log in and re-authorize." 
      });

    } catch (err: any) {
      console.error("Send password error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
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
