import { doc, getDoc } from 'firebase/firestore';
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
  try {
    const res = await fetch('/api/smm/sync', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.services && Array.isArray(data.services) && data.services.length > 0) {
        const parsed = parseSMMResponse(data.services);
        try {
          localStorage.setItem('smm_cached_services', JSON.stringify(parsed));
        } catch (e) {}
        return parsed;
      }
    }
  } catch (err) {
    console.error("Backend SMM sync failed to fetch:", err);
  }

  // Fallback to localStorage cache if API is offline
  try {
    const cached = localStorage.getItem('smm_cached_services');
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (Array.isArray(parsedCache) && parsedCache.length > 0) {
        return parsedCache;
      }
    }
  } catch (e) {}

  return [];
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
