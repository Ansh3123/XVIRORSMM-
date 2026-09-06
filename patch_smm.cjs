const fs = require('fs');

const code = `import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

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

  // Fallback to local static backup
  try {
    const res = await fetch('/services.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Also map * 1.40 for local static fallback just in case
        const mappedData = data.map(service => {
          if (service.rate) {
             service.rate = (parseFloat(service.rate) * 1.40).toFixed(4);
          }
          return service;
        });
        return parseSMMResponse(mappedData);
      }
    }
  } catch (err) {
    console.warn("Local static services.json backup failed.", err);
  }

  return [];
}

function parseSMMResponse(data: any[]): Service[] {
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => ({
    id: String(item.service),
    platform: determinePlatform(item.category || item.name),
    category: item.category || 'General',
    name: item.name || \`Service \${item.service}\`,
    price: parseFloat(item.rate || '0'),
    minOrder: parseInt(item.min || '10'),
    maxOrder: parseInt(item.max || '10000'),
    status: item.type
  })).filter(s => s.price > 0);
}

function determinePlatform(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('instagram') || t.includes('ig')) return 'Instagram';
  if (t.includes('telegram') || t.includes('tg')) return 'Telegram';
  if (t.includes('youtube') || t.includes('yt')) return 'YouTube';
  if (t.includes('tiktok')) return 'TikTok';
  if (t.includes('facebook') || t.includes('fb')) return 'Facebook';
  if (t.includes('twitter') || t.includes('x')) return 'Twitter';
  if (t.includes('spotify')) return 'Spotify';
  return 'Other';
}
`;
fs.writeFileSync('src/lib/smm.ts', code);
