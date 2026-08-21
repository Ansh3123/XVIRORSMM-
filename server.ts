import express from "express";
import path from "path";
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
      const apiKey = "791fad89fb2183fc6d7665693313f66e";
      const apiUrl = "https://smmupi.com/api/v2";

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
      const apiKey = "791fad89fb2183fc6d7665693313f66e";
      const apiUrl = "https://smmupi.com/api/v2";

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
