import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const DEFAULT_SMM_API_KEY = "2faaf3ae79aa75071f6ac95727f141c0";
const DEFAULT_SMM_API_URL = "https://smmupi.com/api/v2";

export interface Service {
  id: string;
  platform: string;
  category: string;
  name: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  status?: string;
}

export async function getClientSmmConfig() {
  try {
    const docRef = doc(db, 'settings', 'smm');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.apiKey && data.apiUrl) {
        return {
          apiKey: data.apiKey,
          apiUrl: data.apiUrl
        };
      }
    }
  } catch (err) {
    console.warn("Could not fetch SMM settings from firestore, using defaults:", err);
  }
  return {
    apiKey: DEFAULT_SMM_API_KEY,
    apiUrl: DEFAULT_SMM_API_URL
  };
}

export async function fetchSMMServices(): Promise<Service[]> {
  // Get active config (either from database or requested default)
  const config = await getClientSmmConfig();

  // 1. Try to fetch from the local secure backend API first
  try {
    const res = await fetch('/api/smm/sync', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.services) {
        return parseSMMResponse(data.services);
      }
    }
  } catch (err) {
    console.warn("Backend SMM sync unavailable or failed. Trying local static backup...", err);
  }

  // 1.5 Try to fetch from the local static backup services.json (highly reliable on static hosts like Vercel/GitHub Pages)
  try {
    const res = await fetch('/services.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log("Successfully loaded SMM services from local static backup services.json!");
        return parseSMMResponse(data);
      }
    }
  } catch (err) {
    console.warn("Local static services.json backup failed. Trying direct client fallback...", err);
  }

  // 2. Fallback: Try to fetch directly from SMM provider (in case SMM provider has CORS enabled)
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        key: config.apiKey,
        action: "services"
      })
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return parseSMMResponse(data);
      }
    }
  } catch (err) {
    console.warn("Direct SMM fetch failed due to CORS. Trying CORS proxy bypass...", err);
  }

  // 3. Ultimate Fallback: Fetch via completely free public CORS proxies
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(config.apiUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${config.apiUrl}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(config.apiUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      let data: any = null;
      if (proxyUrl.includes('allorigins')) {
        // AllOrigins returns wrapped response
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const wrapper = await res.json();
          data = JSON.parse(wrapper.contents);
        }
      } else {
        const response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            key: config.apiKey,
            action: "services"
          })
        });
        if (response.ok) {
          data = await response.json();
        }
      }

      if (data && Array.isArray(data)) {
        console.log("Successfully fetched SMM services via proxy:", proxyUrl);
        return parseSMMResponse(data);
      }
    } catch (proxyErr) {
      console.warn(`Proxy ${proxyUrl} failed:`, proxyErr);
    }
  }

  console.warn("All live network SMM service fetching options failed or were blocked. Returning empty list as requested.");
  return [];
}

function parseSMMResponse(services: any[]): Service[] {
  return services.map((s: any) => {
    const originalPrice = parseFloat(s.rate || '0');
    // Calculate custom profit markup matching user's exact specification:
    // e.g. 2rs rate * 0.40 markup = 0.80rs profit, yielding 2.80rs total price.
    const markup = originalPrice * 0.40;
    const markedUpPrice = originalPrice + markup;
    return {
      id: String(s.service),
      platform: s.category ? s.category.trim().split(' ')[0] : 'Other',
      category: s.category || 'Default',
      name: s.name || `Service ${s.service}`,
      price: parseFloat(markedUpPrice.toFixed(4)),
      minOrder: parseInt(s.min || '0'),
      maxOrder: parseInt(s.max || '0'),
      status: 'active'
    };
  });
}
