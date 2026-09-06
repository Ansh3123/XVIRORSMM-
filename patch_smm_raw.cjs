const fs = require('fs');

const code = `import { doc, getDoc } from 'firebase/firestore';
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
      if (data.success && data.services) {
        return parseSMMResponse(data.services);
      }
    } else {
      console.error("Backend SMM sync returned non-OK status");
    }
  } catch (err) {
    console.error("Backend SMM sync failed to fetch:", err);
  }

  return [];
}

function parseSMMResponse(data: any[]): Service[] {
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => ({
    id: String(item.service),
    category: item.category || 'General',
    name: item.name || \`Service \${item.service}\`,
    price: parseFloat(String(item.rate || '0').replace(/,/g, '')),
    minOrder: parseInt(item.min || '10'),
    maxOrder: parseInt(item.max || '10000'),
    status: item.type,
    desc: item.desc || ''
  })).filter(s => s.price > 0);
}
`;

fs.writeFileSync('src/lib/smm.ts', code);
console.log('Patched smm.ts to keep emojis and raw category');
