import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Service {
  id: string;
  category: string;
  name: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  status?: string;
  desc?: string;
}

export async function fetchSMMServices(): Promise<Service[]> {
  // 1. Fallback to localStorage cache first for instant loading
  try {
    const cached = localStorage.getItem('smm_cached_services');
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (Array.isArray(parsedCache) && parsedCache.length > 0) {
        // Return cached services immediately, but also trigger background sync
        syncAndCacheServices().catch(() => {});
        return parsedCache;
      }
    }
  } catch (e) {}

  // 2. Fetch from API sync endpoint
  return await syncAndCacheServices();
}

async function syncAndCacheServices(): Promise<Service[]> {
  try {
    const res = await fetch('/api/smm/sync', { method: 'POST' });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("Sync API returned non-JSON:", text.slice(0, 200));
    }

    if (data && data.success && data.services && Array.isArray(data.services) && data.services.length > 0) {
      const parsed = parseSMMResponse(data.services);
      try {
        localStorage.setItem('smm_cached_services', JSON.stringify(parsed));
      } catch (e) {}
      return parsed;
    }
  } catch (err) {
    console.error("Backend SMM sync failed to fetch:", err);
  }

  // 3. Ultimate fallback default services if offline
  return [
    { id: "1", category: "Instagram Followers", name: "Instagram Followers (HQ Real)", price: 90, minOrder: 50, maxOrder: 10000, status: "active", desc: "High quality real followers" },
    { id: "2", category: "Instagram Likes", name: "Instagram Likes (Instant)", price: 45, minOrder: 20, maxOrder: 5000, status: "active", desc: "Instant high speed likes" },
    { id: "3", category: "YouTube Views", name: "YouTube Views (Retention)", price: 150, minOrder: 100, maxOrder: 50000, status: "active", desc: "High retention watchtime views" },
    { id: "4", category: "Telegram Members", name: "Telegram Channel Members", price: 120, minOrder: 50, maxOrder: 20000, status: "active", desc: "Active global members" }
  ];
}

function parseSMMResponse(data: any[]): Service[] {
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => ({
    id: String(item.service),
    category: item.category || 'General',
    name: item.name || `Service ${item.service}`,
    price: parseFloat(String(item.rate || '0').replace(/,/g, '')),
    minOrder: parseInt(item.min || '10'),
    maxOrder: parseInt(item.max || '10000'),
    status: item.type,
    desc: item.desc || ''
  })).filter(s => s.price > 0);
}
