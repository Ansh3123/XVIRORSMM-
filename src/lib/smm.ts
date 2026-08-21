const SMM_API_KEY = "27400c706565bd0de788f2ce390b4236ac20d4fc";
const SMM_API_URL = "https://themainsmmprovider.com/api/v2";

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

export async function fetchSMMServices(): Promise<Service[]> {
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
    console.warn("Backend SMM sync unavailable or failed. Trying direct client fallback...", err);
  }

  // 2. Fallback: Try to fetch directly from SMM provider (in case SMM provider has CORS enabled)
  try {
    const response = await fetch(SMM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        key: SMM_API_KEY,
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
    `https://corsproxy.io/?${encodeURIComponent(SMM_API_URL)}`,
    `https://thingproxy.freeboard.io/fetch/${SMM_API_URL}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(SMM_API_URL)}`
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
            key: SMM_API_KEY,
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

  throw new Error("All SMM service loading attempts failed.");
}

function parseSMMResponse(services: any[]): Service[] {
  return services.map((s: any) => {
    const originalPrice = parseFloat(s.rate || '0');
    const markup = originalPrice > 5 ? 4 : 2;
    return {
      id: String(s.service),
      platform: s.category ? s.category.trim().split(' ')[0] : 'Other',
      category: s.category || 'Default',
      name: s.name || `Service ${s.service}`,
      price: originalPrice + markup,
      minOrder: parseInt(s.min || '0'),
      maxOrder: parseInt(s.max || '0'),
      status: 'active'
    };
  });
}
