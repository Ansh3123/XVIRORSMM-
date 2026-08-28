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

  console.warn("All live network and static SMM service fetching options timed out or were blocked. Activating local curated SMM fallback catalog.");
  return [
    {
      id: "5653",
      platform: "Instagram",
      category: "Instagram Followers",
      name: "Instagram Followers [Non-Drop] [Real Indian Accounts] ♻️",
      price: 41.92,
      minOrder: 100,
      maxOrder: 50000,
      status: "active"
    },
    {
      id: "5654",
      platform: "Instagram",
      category: "Instagram Likes",
      name: "Instagram Likes [Super Instant] [No Drop] [Real Accounts] ❤️",
      price: 12.50,
      minOrder: 50,
      maxOrder: 100000,
      status: "active"
    },
    {
      id: "5655",
      platform: "YouTube",
      category: "YouTube Views",
      name: "YouTube Views [High Retention] [Lifetime Guarantee] 📺",
      price: 120.00,
      minOrder: 100,
      maxOrder: 1000000,
      status: "active"
    },
    {
      id: "5656",
      platform: "YouTube",
      category: "YouTube Subscribers",
      name: "YouTube Subscribers [Non-Drop] [Speed: 500/Day] 🔴",
      price: 450.00,
      minOrder: 50,
      maxOrder: 10000,
      status: "active"
    },
    {
      id: "5657",
      platform: "Telegram",
      category: "Telegram Members",
      name: "Telegram Channel/Group Members [0-10% Drop] [Instant] ✈️",
      price: 28.00,
      minOrder: 100,
      maxOrder: 200000,
      status: "active"
    },
    {
      id: "5658",
      platform: "Facebook",
      category: "Facebook Followers",
      name: "Facebook Profile Followers [Instant] [Lifetime Refill] 👥",
      price: 35.00,
      minOrder: 100,
      maxOrder: 100000,
      status: "active"
    },
    {
      id: "5659",
      platform: "TikTok",
      category: "TikTok Followers",
      name: "TikTok Followers [Real & Active] [No Drop] [Fast Start] 🎵",
      price: 85.00,
      minOrder: 100,
      maxOrder: 500000,
      status: "active"
    },
    {
      id: "5660",
      platform: "Twitter/X",
      category: "X Followers",
      name: "X (Twitter) Followers [Real Looking] [Safe & High Quality] 🐦",
      price: 195.00,
      minOrder: 50,
      maxOrder: 25000,
      status: "active"
    }
  ];
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
