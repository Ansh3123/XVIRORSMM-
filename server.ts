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
      const apiKey = process.env.SMM_API_KEY || "c1e9dedb99e6cbfccd7f2cbb01cfd5b7";
      const apiUrl = process.env.SMM_API_URL; // Optional. e.g. https://smmprovider.com/api/v2

      if (!apiUrl) {
        console.log("[SMM API] Using mock data because SMM_API_URL is not set.");
        // Mock data covering all user requested platforms and categories
        const platforms: Record<string, string[]> = {
          "Instagram": ["Likes", "Followers", "Views", "Comments", "Shares"],
          "Facebook": ["Likes", "Followers", "Views", "Comments", "Shares"],
          "Youtube": ["Subscriber", "Likes", "Views", "Comments", "Shares"],
          "Telegram": ["Channel members", "Views"]
        };
        
        let mockServices: any[] = [];
        let idCounter = 1;
        
        for (const [platform, categories] of Object.entries(platforms)) {
          for (const category of categories) {
            for (let i = 1; i <= 12; i++) {
              mockServices.push({
                service: idCounter++,
                name: `${platform} ${category} [Server ${i}]`,
                type: "Default",
                category: `${platform} ${category}`,
                rate: (Math.random() * 50 + 10).toFixed(2),
                min: "100",
                max: "10000"
              });
            }
          }
        }

        return res.json({ success: true, services: mockServices });
      }

      // If the provider URL is set, make the actual external fetch
      const response = await fetch(`${apiUrl}?key=${apiKey}&action=services`);
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
      const apiKey = process.env.SMM_API_KEY || "c1e9dedb99e6cbfccd7f2cbb01cfd5b7";
      const apiUrl = process.env.SMM_API_URL;

      if (!apiKey) {
        return res.status(500).json({ error: "SMM API key not configured" });
      }

      if (!apiUrl) {
        console.log(`[SMM API Mock] Placing order: Service ${service}, Link: ${link}, Qty: ${quantity}`);
        return res.json({ success: true, orderId: Math.floor(Math.random() * 100000) });
      }

      // Make actual fetch to API provider
      const response = await fetch(`${apiUrl}?key=${apiKey}&action=add&service=${service}&link=${link}&quantity=${quantity}`);
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
