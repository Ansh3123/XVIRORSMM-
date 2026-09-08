import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ALL_APP_SERVICES } from '../data/comprehensiveServices';

export interface SMMService {
  service: number | string;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  desc?: string;
}

export interface Service {
  id: string;
  category: string;
  name: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  status?: string;
  desc?: string;
  type?: string;
  rate?: string;
}

// Curated default services list with 1.25 rate markup
export const CURATED_SERVICES: Service[] = [
  { id: "6131", category: "IG Followers", name: "𝐈𝐆 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭+ 15 𝐏𝐨𝐬𝐭 ( 𝐍𝐨𝐧 - 𝐃𝐫𝐨𝐩 ) ( 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 𝐨𝐧 25/1/2026 ) 6131 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 & 𝐁𝐨𝐭 [ 𝐌𝐚𝐱 50𝐊 ] 50𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡ 𝐂𝐡𝐞𝐚𝐩𝐞𝐬𝐭 𝐈𝐧 𝐓𝐡𝐞 𝐰𝐨𝐫𝐥𝐝 🌍", price: 32 * 1.25, minOrder: 100, maxOrder: 10000000, status: 'active', rate: "32" },
  { id: "98", category: "IG Followers", name: "𝗜𝗚 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀 100% 𝗢𝗹𝗱 𝗔𝗰𝗰𝗼𝘂𝗻𝘁𝘀 𝗪𝗶𝘁𝗵 15 𝗣𝗼𝘀𝘁'𝘀 [ 𝗡𝗼𝗻-𝗗𝗿𝗼𝗽 ] 𝗨𝗟𝗧𝗥𝗔 𝗙𝗔𝗦𝗧 300𝗞/500𝗸 𝗗𝗮𝘆𝘀 | 𝗡𝗼-𝗥𝗲𝗳𝗶𝗹𝗹 ⚠️ | 𝗔𝗹𝗹 𝗧𝘆𝗽𝗲𝘀 𝗙𝗹𝗮𝗴 ⭐⭐⭐", price: 98 * 1.25, minOrder: 10, maxOrder: 10000000, status: 'active', rate: "98" },
  { id: "4980", category: "IG Followers", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐟𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 8+ 𝐏𝐨𝐬𝐭'𝐬 [ 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ] 500𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲'𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ ( 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐎𝐧𝐥𝐲 𝐨𝐧 𝐓𝐌𝐒 ) 💖", price: 125 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "125" },
  { id: "5120", category: "IG Followers", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 15 𝐏𝐨𝐬𝐭 [ 𝐍𝐨𝐧- 𝐃𝐫𝐨𝐩 ] 500𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ ( 𝐎𝐧𝐞 𝐓𝐚𝐩 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞𝐝 ) 🚀🚀🚀🚀 ( 𝐎𝐰𝐧 𝐬𝐞𝐫𝐯𝐞𝐫 ) 20% 𝐄𝐱𝐭𝐫𝐚 𝐃𝐞𝐥𝐢𝐯𝐞𝐫𝐲 ☠️ 𝐑𝐞𝐬𝐞𝐥𝐥𝐞𝐫𝐬 𝐅𝐚𝐯𝐨𝐫𝐢𝐭𝐞 ❤️", price: 140 * 1.25, minOrder: 100, maxOrder: 50000000, status: 'active', rate: "140" },
  { id: "5246", category: "IG Followers", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 𝐏𝐨𝐬𝐭'𝐬 [ 0-5% 𝐃𝐫𝐨𝐩 ] 200𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ 💖𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐎𝐧𝐥𝐲 𝐨𝐧 𝐓𝐌𝐒 💖", price: 170 * 1.25, minOrder: 10, maxOrder: 10000, status: 'active', rate: "170" },
  { id: "5184", category: "IG Followers", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐏𝐨𝐬𝐭'𝐬 [ 𝐌𝐚𝐱 5𝐌 ] 𝐔𝐥𝐭𝐫𝐚 𝐅𝐚𝐬𝐭 200𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 𝐖𝐢𝐭𝐡 𝐁𝐨𝐭𝐭𝐨𝐧 ♻️ 𝐁𝐢𝐠 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 𝐀𝐜𝐜𝐞𝐩𝐭𝐞𝐝 ( 𝐂𝐚𝐧𝐜𝐞𝐥 & 𝐑𝐄𝐅𝐈𝐋𝐋 𝐄𝐧𝐚𝐛𝐥𝐞𝐝 ) 🚀🚀🚀🚀🚀", price: 185.206 * 1.25, minOrder: 10, maxOrder: 10000000, status: 'active', rate: "185.206" },
  { id: "3552", category: "IG Followers", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 15 𝐏𝐨𝐬𝐭 [ 𝐒𝐮𝐩𝐞𝐫 𝐒𝐭𝐚𝐛𝐥𝐞 ] 800𝐤 𝐝𝐚𝐲𝐬 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️😍 𝐁𝐮𝐥𝐥𝐞𝐭 𝐒𝐩𝐞𝐞𝐝 𝐝𝐞𝐥𝐢𝐯𝐞𝐫𝐲 | 𝐀𝐥𝐥 𝐅𝐥𝐚𝐠 | 𝐅𝐥𝐚𝐠 𝐎𝐧/𝐎𝐅𝐅⭐ 💝 ⭐ ( RB -LIF )", price: 172 * 1.25, minOrder: 10, maxOrder: 5000000, status: 'active', rate: "172" },
  { id: "4921", category: "IG Followers", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 15 𝐏𝐨𝐬𝐭 [ 𝐍𝐨𝐧- 𝐃𝐫𝐨𝐩 ] 300𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ ❤️ 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐎𝐧𝐥𝐲 𝐨𝐧 𝐓𝐌𝐒 ❤️ ( 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ) 𝐂𝐡𝐞𝐚𝐩𝐞𝐬𝐭 𝐈𝐧 𝐓𝐡𝐞 𝐖𝐡𝐨𝐥𝐞 𝐖𝐨𝐫𝐥𝐝 🌍🌍", price: 190 * 1.25, minOrder: 100, maxOrder: 500000, status: 'active', rate: "190" },
  { id: "4290", category: "IG Followers", name: "𝗜𝗻𝘀𝘁𝐚𝗴𝗿𝗮𝗺 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀 100% 𝗢𝗹𝗱 𝗔𝗰𝗰𝗼𝘂𝗻𝘁𝘀 𝗪𝗶𝘁𝗵 𝗣𝗼𝘀𝘁 [ 𝗡𝗼𝗻 - 𝗗𝗿𝗼𝗽 ] 𝗨𝗟𝗧𝗥𝗔 𝗙𝗔𝗦𝗧 300𝗞/𝗛𝗼𝘂𝗿 | 𝗦𝘁𝗮𝗯𝗹𝗲 𝗔𝗳𝘁𝗲𝗿 𝗨𝗽𝗱𝗮𝘁𝗲 | 𝗟𝗶𝗳𝗲𝘁𝗶𝗺𝗲 𝗥𝗲𝗳𝗶𝗹𝗹 ♻️ 𝗢𝗻𝗲 𝗰𝗹𝗶𝗰𝗸 𝗗𝗼𝗻𝗲 𝗙𝗼𝗿 𝗔𝗹𝗹 𝗙𝗹𝗮𝗴 ⭐⭐ ( RB - LIF )", price: 395 * 1.25, minOrder: 10, maxOrder: 5000000, status: 'active', rate: "395" },
  { id: "6125", category: "Instagram Followers Real + HQ", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 + 𝐇𝐐 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 [ 𝐌𝐚𝐱 100𝐊 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 100𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 132 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "132" },
  { id: "6126", category: "Instagram Followers Real + HQ", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 + 𝐇𝐐 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 [ 𝐌𝐚𝐱 100𝐊 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 100𝐊/𝐃𝐚𝐲 | 30 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 148.1477 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "148.1477" },
  { id: "6127", category: "Instagram Followers Real + HQ", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 + 𝐇𝐐 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 [ 𝐌𝐚𝐱 100𝐊 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 100𝐊/𝐃𝐚𝐲 | 60 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 155.7197 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "155.7197" },
  { id: "6128", category: "Instagram Followers Real + HQ", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 + 𝐇𝐐 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 [ 𝐌𝐚𝐱 100𝐊 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 100𝐊/𝐃𝐚𝐲 | 90 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 162.2917 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "162.2917" },
  { id: "6129", category: "Instagram Followers Real + HQ", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 + 𝐇𝐐 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 [ 𝐌𝐚𝐱 100𝐊 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 100𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 170.8636 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "170.8636" },
  { id: "6130", category: "Instagram Followers Real + HQ", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐑𝐞𝐚𝐥 + 𝐇𝐐 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 [ 𝐌𝐚𝐱 100𝐊 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 100𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 180.4356 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "180.4356" },
  { id: "6103", category: "Instagram Reels / Video Views (Ultra Cheap)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐕𝐢𝐞𝐰𝐬 𝐑𝐞𝐞𝐥𝐬 / 𝐕𝐢𝐝𝐞𝐨 ( 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 | 500𝐊/𝐃𝐚𝐲 | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀 🚀 🚀", price: 0.15 * 1.25, minOrder: 100, maxOrder: 2147483647, status: 'active', rate: "0.15" },
  { id: "6104", category: "Instagram Reels / Video Views (Ultra Cheap)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐕𝐢𝐞𝐰𝐬 𝐑𝐞𝐞𝐥𝐬 / 𝐕𝐢𝐝𝐞𝐨 ( 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 | 700𝐊/𝐃𝐚𝐲 | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀 🚀 🚀", price: 0.1238 * 1.25, minOrder: 100, maxOrder: 2147483647, status: 'active', rate: "0.1238" },
  { id: "6105", category: "Instagram Reels / Video Views (Ultra Cheap)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐕𝐢𝐞𝐰𝐬 𝐑𝐞𝐞𝐥𝐬 / 𝐕𝐢𝐝𝐞𝐨 ( 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 | 1𝐌/𝐃𝐚𝐲 | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀 🚀 🚀", price: 0.1333 * 1.25, minOrder: 100, maxOrder: 2147483647, status: 'active', rate: "0.1333" },
  { id: "5998", category: "⚡ IG Services Emergency Update (One Click Done) ⚡", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐥𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐏𝐨𝐬𝐭'𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 200𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️", price: 3 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "3" },
  { id: "5894", category: "⚡ IG Services Emergency Update (One Click Done) ⚡", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 𝐇𝐐 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐌𝐚𝐱 1𝐌 ) 50𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️", price: 3.2 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "3.2" },
  { id: "5893", category: "⚡ IG Services Emergency Update (One Click Done) ⚡", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐥𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐀𝐥𝐦𝐨𝐬𝐭 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 200𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡⚡", price: 3.2 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "3.2" },
  { id: "5890", category: "⚡ IG Services Emergency Update (One Click Done) ⚡", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 500𝐊/ 𝐏𝐞𝐫 𝐇𝐨𝐮𝐫 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡⚡ ( 𝐍𝐞𝐯𝐞𝐫 𝐒𝐭𝐮𝐜𝐤𝐞𝐝 )", price: 0.145 * 1.25, minOrder: 100, maxOrder: 1000000000, status: 'active', rate: "0.145" },
  { id: "5891", category: "⚡ IG Services Emergency Update (One Click Done) ⚡", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐥𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️", price: 3.7 * 1.25, minOrder: 100, maxOrder: 5000, status: 'active', rate: "3.7" },
  { id: "5974", category: "Instagram Random Comments (New)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐚𝐧𝐝𝐨𝐦 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐌𝐚𝐱 100𝐊 ) 50𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡ |", price: 47.9719 * 1.25, minOrder: 10, maxOrder: 100000, status: 'active', rate: "47.9719" },
  { id: "5975", category: "Instagram Random Comments (New)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐚𝐧𝐝𝐨𝐦 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐌𝐚𝐱 100𝐊 ) 50𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡ |", price: 49.2005 * 1.25, minOrder: 10, maxOrder: 100000, status: 'active', rate: "49.2005" },
  { id: "5976", category: "Instagram Random Comments (New)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐚𝐧𝐝𝐨𝐦 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐌𝐚𝐱 100𝐊 ) 50𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡ |", price: 52.1529 * 1.25, minOrder: 10, maxOrder: 100000, status: 'active', rate: "52.1529" },
  { id: "5951", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐒𝐭𝐨𝐫𝐲 𝐕𝐢𝐞𝐰𝐬 𝐅𝐨𝐫 𝐀𝐥𝐥 𝐒𝐭𝐨𝐫𝐲 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] 30𝐊/𝐃𝐚𝐲 | 𝐒𝐥𝐨𝐰 𝐒𝐭𝐚𝐫𝐭 ⚡ | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️", price: 0.29 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "0.29" },
  { id: "5952", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐒𝐭𝐨𝐫𝐲 𝐕𝐢𝐞𝐰𝐬 𝐅𝐨𝐫 𝐀𝐥𝐥 𝐒𝐭𝐨𝐫𝐲 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] 50𝐊/𝐃𝐚𝐲 | 𝐅𝐚𝐬𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡ | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️", price: 5.9186 * 1.25, minOrder: 100, maxOrder: 200000, status: 'active', rate: "5.9186" },
  { id: "5953", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐒𝐭𝐨𝐫𝐲 𝐕𝐢𝐞𝐰𝐬 𝐅𝐨𝐫 𝐀𝐥𝐥 𝐒𝐭𝐨𝐫𝐲 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] 500𝐊/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 ⚡ | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️", price: 9.7186 * 1.25, minOrder: 100, maxOrder: 10000, status: 'active', rate: "9.7186" },
  { id: "5954", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐏𝐫𝐨𝐟𝐞𝐬𝐬𝐭𝐢𝐨𝐧𝐚𝐥 𝐃𝐚𝐬𝐡𝐛𝐨𝐚𝐫𝐝 𝐕𝐢𝐞𝐰𝐬 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 𝐀𝐜𝐜𝐞𝐩𝐭𝐞𝐝 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] 10-50𝐌/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 🚀🚀🚀🚀🚀", price: 0.1714 * 1.25, minOrder: 100, maxOrder: 2147483647, status: 'active', rate: "0.1714" },
  { id: "5948", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐕𝐢𝐞𝐰𝐬 𝐑𝐞𝐚𝐜𝐡+𝐈𝐦𝐩𝐫𝐞𝐬𝐬𝐢𝐨𝐧𝐬 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] | 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 | 𝐂𝐚𝐧𝐜𝐞𝐥 𝐄𝐧𝐚𝐛𝐥𝐞 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞", price: 5.7858 * 1.25, minOrder: 100, maxOrder: 10000000, status: 'active', rate: "5.7858" },
  { id: "5949", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐕𝐢𝐬𝐢𝐭𝐬 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] | 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 | 𝐂𝐚𝐧𝐜𝐞𝐥 𝐄𝐧𝐚𝐛𝐥𝐞 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 4.8162 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "4.8162" },
  { id: "5950", category: "Instagram Story View's - Reach+ Impressions", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐈𝐦𝐩𝐫𝐞𝐬𝐬𝐢𝐨𝐧𝐬 [ 𝐅𝐫𝐨𝐦 𝐇𝐨𝐦𝐞 𝐄𝐱𝐩𝐥𝐨𝐫𝐞 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 ] [ 𝐌𝐚𝐱 1𝐌 ] | 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 | 𝐂𝐚𝐧𝐜𝐞𝐥 𝐄𝐧𝐚𝐛𝐥𝐞 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 4.8162 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "4.8162" },
  { id: "5887", category: "Instagram Reels Views Emergency Update (One Click Done)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥 𝐕𝐢𝐞𝐰𝐬 𝐔𝐋𝐓𝐑𝐀 𝐂𝐇𝐄𝐀𝐏 | 200𝐊/𝐃𝐚𝐲 | 𝐅𝐚𝐬𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡", price: 0.0678 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "0.0678" },
  { id: "5777", category: "Instagram Reels Views Emergency Update (One Click Done)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 𝐔𝐋𝐓𝐑𝐀 𝐂𝐇𝐄𝐀𝐏 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 |𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀", price: 0.16 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "0.16" },
  { id: "4662", category: "Instagram Reels Views Emergency Update (One Click Done)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 [ 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ] 𝐔𝐋𝐓𝗥𝐀 𝐅𝐀𝐒𝐓 1𝐌/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 ♻️🚀🚀🚀🚀🚀 ( 𝐂𝐚𝐧𝐜𝐞𝐥 𝐄𝐧𝐚𝐛𝐥𝐞 )", price: 0.15 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "0.15" },
  { id: "5381", category: "Instagram Reels Views Emergency Update (One Click Done)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 𝐃𝐢𝐟𝐟𝐞𝐫𝐞𝐧𝐭 𝐒𝐞𝐫𝐯𝐞𝐫 📈 ( 100% 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 𝐒𝐮𝐩𝐞𝐫𝐟𝐚𝐬𝐭 𝐏𝐫𝐨𝐯𝐢𝐝𝐞𝐫 10𝐌+ 𝐏𝐞𝐫 𝐇𝐨𝐮𝐫 | 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐒𝐞𝐫𝐯𝐞𝐫𝐬 | 𝐀𝐥𝐰𝐚𝐲𝐬 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅ | 𝐀𝐥𝐰𝐚𝐲𝐬 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀🚀", price: 0.19 * 1.25, minOrder: 100, maxOrder: 10000000, status: 'active', rate: "0.19" },
  { id: "5886", category: "ULTRA Cheap Services (Available Only On TMS)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡⚡ [ 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 ]", price: 0.15 * 1.25, minOrder: 100, maxOrder: 10000000, status: 'active', rate: "0.15" },
  { id: "5826", category: "Facebook Services", name: "𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐏𝐨𝐬𝐭 𝐋𝐢𝐤𝐞𝐬 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐒𝐞𝐫𝐯𝐞𝐫 500𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️", price: 32 * 1.25, minOrder: 50, maxOrder: 10000000, status: 'active', rate: "32" },
  { id: "5780", category: "Facebook Services", name: "𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 𝐏𝐫𝐨𝐟𝐢𝐥𝐞/ 𝐏𝐚𝐠𝐞 ( 𝐌𝐚𝐱 100𝐊 ) 30𝐊-50𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀 ( 𝐔𝐋𝐓𝐑𝐀 𝐂𝐇𝐄𝐀𝐏 ) 𝐑𝐞𝐬𝐞𝐥𝐥𝐞𝐫𝐬 𝐅𝐚𝐯𝐨𝐫𝐢𝐭𝐞 ❤️", price: 35.8 * 1.25, minOrder: 100, maxOrder: 100000, status: 'active', rate: "35.8" },
  { id: "6093", category: "Instagram likes (Cheapest In The world)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡⚡", price: 2.6 * 1.25, minOrder: 10, maxOrder: 100000, status: 'active', rate: "2.6" },
  { id: "6094", category: "Instagram likes (Cheapest In The world)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 30 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️| 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡⚡", price: 2.8 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "2.8" },
  { id: "6095", category: "Instagram likes (Cheapest In The world)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨𝐧 𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️| 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 ⚡⚡⚡⚡", price: 2.9431 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "2.9431" },
  { id: "5862", category: "Instagram Likes (Cheapest)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 [ 𝐌𝐚𝐱 1𝐌 ] 100𝐊-200𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 4.77 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "4.77" },
  { id: "5863", category: "Instagram Likes (Cheapest)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 [ 𝐌𝐚𝐱 1𝐌 ] 100𝐊-200𝐊/𝐃𝐚𝐲 | 30 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 4.794 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "4.794" },
  { id: "5864", category: "Instagram Likes (Cheapest)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 [ 𝐌𝐚𝐱 1𝐌 ] 100𝐊-200𝐊/𝐃𝐚𝐲 | 60 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 4.9542 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "4.9542" },
  { id: "5865", category: "Instagram Likes (Cheapest)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 [ 𝐌𝐚𝐱 1𝐌 ] 100𝐊-200𝐊/𝐃𝐚𝐲 | 90 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 4.9969 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "4.9969" },
  { id: "5866", category: "Instagram Likes (Cheapest)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 [ 𝐌𝐚𝐱 1𝐌 ] 100𝐊-200𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 5.3924 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "5.3924" },
  { id: "5867", category: "Instagram Likes (Cheapest)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 [ 𝐌𝐚𝐱 1𝐌 ] 100𝐊-200𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 5.5 * 1.25, minOrder: 10, maxOrder: 1000000, status: 'active', rate: "5.5" },
  { id: "5852", category: "Instagram Likes 100% Indian 🇮🇳", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐒𝐭𝐨𝐫𝐲' 𝐒𝐡𝐚𝐫𝐞 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 8.6366 * 1.25, minOrder: 50, maxOrder: 500000, status: 'active', rate: "8.6366" },
  { id: "5853", category: "Instagram Likes 100% Indian 🇮🇳", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐒𝐭𝐨𝐫𝐲' 𝐒𝐡𝐚𝐫𝐞 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 30 𝐃𝐚𝐲𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 8.7467 * 1.25, minOrder: 50, maxOrder: 500000, status: 'active', rate: "8.7467" },
  { id: "5854", category: "Instagram Likes 100% Indian 🇮🇳", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐒𝐭𝐨𝐫𝐲' 𝐒𝐡𝐚𝐫𝐞 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 60 𝐃𝐚𝐲𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 8.9369 * 1.25, minOrder: 50, maxOrder: 500000, status: 'active', rate: "8.9369" },
  { id: "5855", category: "Instagram Likes 100% Indian 🇮🇳", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐒𝐭𝐨𝐫𝐲' 𝐒𝐡𝐚𝐫𝐞 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 90 𝐃𝐚𝐲𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 9.032 * 1.25, minOrder: 50, maxOrder: 500000, status: 'active', rate: "9.032" },
  { id: "5856", category: "Instagram Likes 100% Indian 🇮🇳", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐒𝐭𝐨𝐫𝐲' 𝐒𝐡𝐚𝐫𝐞 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲𝐬 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 9.2221 * 1.25, minOrder: 50, maxOrder: 500000, status: 'active', rate: "9.2221" },
  { id: "5857", category: "Instagram Likes 100% Indian 🇮🇳", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐒𝐭𝐨𝐫𝐲' 𝐒𝐡𝐚𝐫𝐞 𝐏𝐫𝐨𝐟𝐢𝐥𝐞𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 9.4123 * 1.25, minOrder: 50, maxOrder: 500000, status: 'active', rate: "9.4123" },
  { id: "6089", category: "Instagram Shares New", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐒𝐡𝐚𝐫𝐞 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] 500𝐊-1𝐌/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️", price: 0.7407 * 1.25, minOrder: 10, maxOrder: 2147483647, status: 'active', rate: "0.7407" },
  { id: "6090", category: "Instagram Shares New", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐒𝐡𝐚𝐫𝐞 [ 𝐌𝐚𝐱 𝐔𝐧𝐥𝐢𝐦𝐢𝐭𝐞𝐝 ] 500𝐊-1𝐌/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️", price: 0.808 * 1.25, minOrder: 10, maxOrder: 2147483647, status: 'active', rate: "0.808" },
  { id: "5835", category: "Cheapest In The Market", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 𝐔𝐋𝐓𝐑𝐀 𝐅𝐀𝐒𝐓 500𝐊/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 0.15 * 1.25, minOrder: 100, maxOrder: 2147483647, status: 'active', rate: "0.15" },
  { id: "5806", category: "Instagram Reels Views Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥 𝐕𝐢𝐞𝐰𝐬 𝐔𝐋𝐓𝐑𝐀 𝐂𝐇𝐄𝐀𝐏 | 100𝐊/𝐃𝐚𝐲 | 𝐒𝐥𝐨𝐰 𝐅𝐚𝐬𝐭 ⏩", price: 0.15 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "0.15" },
  { id: "5805", category: "Instagram Reels Views Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 𝐔𝐋𝐓𝐑𝐀 𝐅𝐀𝐒𝐓 500𝐊/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 0.15 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "0.15" },
  { id: "5824", category: "Instagram Likes Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨 / 𝐋𝐨𝐰 𝐃𝐫𝐨𝐩 ) 50𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️", price: 5.1 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "5.1" },
  { id: "5804", category: "Instagram Likes Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐏𝐨𝐬𝐭 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️🚀🚀", price: 5.2 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "5.2" },
  { id: "5619", category: "Instagram Likes Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐥𝐢𝐤𝐞𝐬 100% 𝐑𝐞𝐚𝐥 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 365 𝐃𝐚𝐲'𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ 🚀🚀🚀", price: 5.2 * 1.25, minOrder: 10, maxOrder: 300000, status: 'active', rate: "5.2" },
  { id: "5766", category: "Instagram Likes Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐎𝐥𝐝 + 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐒𝐭𝐨𝐫𝐲 𝐌𝐢𝐱 [ 𝐌𝐚𝐱 5𝐌 ] 1𝐌/𝐃𝐚𝐲 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅ | 𝐀𝐥𝐰𝐚𝐲𝐬 𝐁𝐮𝐥𝐥𝐞𝐭 𝐒𝐩𝐞𝐞𝐝 𝐃𝐞𝐥𝐢𝐯𝐞𝐫𝐲 ( 𝐍𝐞𝐯𝐞𝐫 𝐒𝐭𝐮𝐜𝐤𝐞𝐝 ) | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 🚀🚀🚀🚀🚀", price: 6.2 * 1.25, minOrder: 10, maxOrder: 500000, status: 'active', rate: "6.2" },
  { id: "5757", category: "Instagram Likes Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 𝐩𝐨𝐬𝐭 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 150𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀 ( 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐎𝐧𝐥𝐲 𝐎𝐧 𝐓𝐦𝐬 ) ♥️♥️♥️", price: 6 * 1.25, minOrder: 10, maxOrder: 300000, status: 'active', rate: "6" },
  { id: "5638", category: "Instagram Likes Cheapest", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭𝐬 𝐖𝐢𝐭𝐡 𝐏𝐨𝐬𝐭 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅ 🌟🌟🌟🌟", price: 2.5987 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "2.5987" },
  { id: "5654", category: "Instagram Comments (New)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐚𝐧𝐝𝐨𝐦 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬 𝐈𝐧𝐝𝐢𝐚𝐧 𝐌𝐢𝐱 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 10𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀 ( 𝐂𝐡𝐞𝐚𝐩𝐞𝐬𝐭 )", price: 249.8096 * 1.25, minOrder: 10, maxOrder: 10000, status: 'active', rate: "249.8096" },
  { id: "5655", category: "Instagram Comments (New)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐂𝐮𝐬𝐭𝐨𝐦 𝐂𝐨𝐦𝐦𝐞𝐧𝐭𝐬 𝐈𝐧𝐝𝐢𝐚𝐧 𝐌𝐢𝐱 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 10𝐊/𝐃𝐚𝐲 | 𝐍𝐨 𝐑𝐞𝐟𝐢𝐥𝐥 ⚠️ | 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀 ( 𝐂𝐡𝐞𝐚𝐩𝐞𝐬𝐭 )", price: 248.8096 * 1.25, minOrder: 10, maxOrder: 10000, status: 'active', rate: "248.8096" },
  { id: "5573", category: "Cheapest In The World", name: "𝐘𝐨𝐮𝐭𝐮𝐛𝐞 𝐒𝐮𝐛𝐬𝐜𝐫𝐢𝐛𝐞𝐫 𝐁𝐨𝐭 ( 𝐌𝐚𝐱 50𝐊 ) 50𝐊/𝐏𝐞𝐫 𝐇𝐨𝐮𝐫 | 𝐍𝐨 𝐑𝐄𝐅𝐈𝐋𝐋 ⚠️ 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 54.6 * 1.25, minOrder: 10, maxOrder: 5000, status: 'active', rate: "54.6" },
  { id: "5574", category: "Cheapest In The World", name: "𝐘𝐨𝐮𝐭𝐮𝐛𝐞 𝐋𝐢𝐤𝐞𝐬 𝐁𝐨𝐭 ( 𝐌𝐚𝐱 100𝐊 ) 50𝐊/𝐏𝐞𝐫 𝐇𝐨𝐮𝐫 | 𝐍𝐨 𝐑𝐄𝐅𝐈𝐋𝐋 ⚠️ 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 54.5 * 1.25, minOrder: 10, maxOrder: 30000, status: 'active', rate: "54.5" },
  { id: "5636", category: "Cheapest In The World", name: "𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐅𝐨𝐥𝐥𝐨𝐰𝐞𝐫𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 200𝐊/𝐃𝐚𝐲 | Lifetime 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ ( 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 ) 🚀🚀🚀🚀", price: 45 * 1.25, minOrder: 10, maxOrder: 3000000, status: 'active', rate: "45" },
  { id: "5572", category: "Cheapest In The World", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐥𝐢𝐤𝐞𝐬 100% 𝐈𝐧𝐝𝐢𝐚𝐧 🇮🇳 𝐖𝐢𝐭𝐡 𝐏𝐨𝐬𝐭'𝐬 ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 500𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️🚀🚀🚀🚀🚀 ( 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 )", price: 8.5 * 1.25, minOrder: 10, maxOrder: 300000, status: 'active', rate: "8.5" },
  { id: "5569", category: "Cheapest In The World", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐋𝐢𝐤𝐞𝐬 100% 𝐎𝐥𝐝 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐖𝐢𝐭𝐡 𝐩𝐨𝐬𝐭 ( 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ) 300𝐊/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️🚀🚀🚀🚀 ( 𝐖𝐨𝐫𝐤𝐢𝐧𝐠 𝐔𝐩𝐝𝐚𝐭𝐞 ) 5-10% 𝐄𝐱𝐭𝐫𝐚 𝐝𝐞𝐥𝐢𝐯𝐞𝐫𝐲 ♥️", price: 9 * 1.25, minOrder: 10, maxOrder: 300000, status: 'active', rate: "9" },
  { id: "5510", category: "Cheapest In The World", name: "𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐂𝐡𝐚𝐧𝐧𝐞𝐥/𝐆𝐫𝐨𝐮𝐩 𝐌𝐞𝐦𝐛𝐞𝐫𝐬 [ 𝐌𝐚𝐱 100𝐊 ] ( 𝐍𝐨𝐧 -𝐃𝐫𝐨𝐩 ) 100𝐊/𝐃𝐚𝐲 | 30 𝐃𝐚𝐲𝐬 𝐑𝐄𝐅𝐈𝐋𝐋 ♻️ 𝐈𝐧𝐬𝐭𝐚𝐧𝐭 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 64.1601 * 1.25, minOrder: 500, maxOrder: 100000, status: 'active', rate: "64.1601" },
  { id: "5266", category: "Instagram Reels Views (Updated)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬/𝐕𝐢𝐝𝐞𝐨 𝐕𝐢𝐞𝐰𝐬 ( 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ) 200𝐊/𝐃𝐚𝐲 | 𝐈𝐧𝐬𝐭𝐚𝐧 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀", price: 0.145 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "0.145" },
  { id: "4901", category: "Instagram Reels Views (Updated)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤| 𝐔𝐋𝐓𝐑𝐀 𝐅𝐀𝐒𝐓 200𝐊/𝐃𝐚𝐲 ((( 𝐔𝐥𝐭𝐫𝐚 𝐂𝐡𝐞𝐚𝐩 )))", price: 0.15 * 1.25, minOrder: 100, maxOrder: 10000000, status: 'active', rate: "0.15" },
  { id: "5267", category: "Instagram Reels Views (Updated)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬/ 𝐕𝐢𝐞𝐰𝐬 ( 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ) 500𝐊-1𝐌/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀", price: 0.195 * 1.25, minOrder: 100, maxOrder: 50000000, status: 'active', rate: "0.195" },
  { id: "5268", category: "Instagram Reels Views (Updated)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬/ 𝐕𝐢𝐞𝐰𝐬 ( 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ) 𝐔𝐋𝐓𝐑𝐀 𝐅𝐀𝐒𝐓 🚀 10𝐌/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 0.97 * 1.25, minOrder: 100, maxOrder: 5000000, status: 'active', rate: "0.97" },
  { id: "5269", category: "Instagram Reels Views (Updated)", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬/ 𝐕𝐢𝐞𝐰𝐬 ( 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ) 𝐒𝐮𝐩𝐞𝐫𝐟𝐚𝐬𝐭 𝐏𝐫𝐨𝐯𝐢𝐝𝐞𝐫 50𝐌/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐒𝐭𝐚𝐫𝐭 🚀🚀🚀🚀🚀 | 𝐎𝐧𝐞 𝐂𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 0.23 * 1.25, minOrder: 100, maxOrder: 10000000, status: 'active', rate: "0.23" },
  { id: "4276", category: "IG Reels Views [ Cheap ]", name: "𝗜𝗻𝘀𝘁𝐚𝗴𝗿𝗮𝗺 𝗥𝗲𝗲𝗹𝘀 𝗩𝗶𝗲𝘄𝘀 | 𝗔𝗹𝗹 𝗟𝗶𝗻𝗸 | 100𝗞/𝗗𝗮𝘆 | 𝗜𝗻𝘀𝘁𝗮𝗻𝘁 🚀", price: 0.1437 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "0.1437" },
  { id: "4334", category: "IG Reels Views [ Cheap ]", name: "Instagram Video Views [ Max Unlimited ] | All Link | Ultrafast ⚡️𝗖𝗵𝗲𝗮𝗽𝗲𝘀𝘁 🏆", price: 0.17 * 1.25, minOrder: 200, maxOrder: 2147483647, status: 'active', rate: "0.17" },
  { id: "4282", category: "IG Reels Views [ Cheap ]", name: "𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺 𝗥𝗲𝗲𝗹𝘀 𝗩𝗶𝗲𝘄𝘀 [ 𝗔𝗹𝗹 𝗟𝗶𝗻𝗸 ] 𝗨𝗹𝘁𝗿𝗮 𝗳𝗮𝘀𝘁 🚀🚀 500𝗞/𝗛𝗼𝘂𝗿 | 𝗢𝗻𝗲 𝗰𝗹𝗶𝗰𝗸 𝗗𝗼𝗻𝗲 ✅", price: 0.17 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "0.17" },
  { id: "4254", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 | 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 | 𝐔𝐋𝐓𝐑𝐀 𝐅𝐀𝐒𝐓 500𝐊/𝐃𝐚𝐲", price: 0.157 * 1.25, minOrder: 100, maxOrder: 7000000, status: 'active', rate: "0.157" },
  { id: "4473", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 [ 𝐍𝐨𝐍 -𝐃𝐫𝐨𝐩 ] 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐖𝐨𝐫𝐤𝐢𝐧𝐠 𝐔𝐩𝐝𝐚𝐭𝐞 | 10𝐌/𝐃𝐚𝐲 | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 ♻️", price: 0.18 * 1.25, minOrder: 100, maxOrder: 46660000000, status: 'active', rate: "0.18" },
  { id: "4288", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐆 𝐕𝐢𝐞𝐰𝐬 𝐅𝐨𝐫 𝐏𝐡𝐨𝐭𝐨𝐬 [ 𝐨𝐧 𝐏𝐡𝐨𝐭𝐨 𝐎𝐫 𝐂𝐚𝐫𝐨𝐮𝐬𝐞𝐥 ]", price: 0.95 * 1.25, minOrder: 10, maxOrder: 10000000, status: 'active', rate: "0.95" },
  { id: "4219", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐆 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 | 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 🖇️ 🚀 𝐎𝐧𝐞 𝐜𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 0.21 * 1.25, minOrder: 100, maxOrder: 7000000, status: 'active', rate: "0.21" },
  { id: "3415", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 [ 𝐖𝐨𝐫𝐤𝐢𝐧𝐠 𝐅𝐚𝐬𝐭/Slow ] 🚀", price: 0.2075 * 1.25, minOrder: 100, maxOrder: 2147483647, status: 'active', rate: "0.2075" },
  { id: "4278", category: "IG Reels Views [ Cheap ]", name: "𝗜𝗻𝘀𝘁𝐚𝗴𝗿𝐚𝗺 𝗥𝗲𝗲𝗹𝘀 𝗩𝗶𝗲𝘄𝘀 | 𝗔𝗹𝗹 𝗟𝗶𝗻𝗸 | 100𝗞/𝗗𝗮𝘆 | 𝗜𝗻𝘀𝘁𝗮𝗻𝘁 🚀", price: 0.19 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "0.19" },
  { id: "4383", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 𝐒𝐮𝐩𝐞𝐫𝐟𝐚𝐬𝐭 | 𝐀𝐥𝐥 𝐋𝐢𝐧𝐤 | 𝐃𝐚𝐲 200𝐊 🚀🚀🚀", price: 0.18 * 1.25, minOrder: 100, maxOrder: 1000000, status: 'active', rate: "0.18" },
  { id: "4148", category: "IG Reels Views [ Cheap ]", name: "𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 𝐑𝐞𝐞𝐥𝐬 𝐕𝐢𝐞𝐰𝐬 [ 𝐍𝐨𝐧-𝐃𝐫𝐨𝐩 ] 300𝐤/500𝐤 𝐏𝐞𝐫 𝐇𝐨𝐮𝐫 | 𝐄𝐦𝐞𝐫𝐠𝐞𝐧𝐜𝐲 𝐔𝐩𝐝𝐚𝐭𝐞 ☠️ | 𝐋𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐑𝐞𝐟𝐢𝐥𝐥 ♻️ | 𝐎𝐧𝐞 𝐜𝐥𝐢𝐜𝐤 𝐃𝐨𝐧𝐞 ✅", price: 0.349 * 1.25, minOrder: 100, maxOrder: 7000000, status: 'active', rate: "0.349" },
  // All Apps Complete Suite
  ...ALL_APP_SERVICES
];

export const APP_PLATFORMS = [
  'All Apps',
  'Instagram',
  'YouTube',
  'Facebook',
  'Telegram',
  'TikTok',
  'Twitter / X',
  'Spotify',
  'Discord',
  'Twitch',
  'LinkedIn',
  'Pinterest',
  'Snapchat',
  'Reddit',
  'WhatsApp',
  'Google Maps',
  'Threads',
  'SoundCloud',
  'Vimeo',
  'Other Apps'
] as const;

export function getAppForService(service: Service | { category?: string; name?: string }): string {
  const raw = ((service.category || '') + ' ' + (service.name || ''));
  const norm = raw.normalize('NFKD').toLowerCase();

  if (norm.includes('threads')) return 'Threads';
  if (norm.includes('instagram') || norm.includes('ig ') || norm.includes('ig-') || norm.includes('reels') || norm.includes('insta')) return 'Instagram';
  if (norm.includes('facebook') || norm.includes('fb ') || norm.includes('fb-')) return 'Facebook';
  if (norm.includes('youtube') || norm.includes('yt ') || norm.includes('yt-') || norm.includes('subscriber')) return 'YouTube';
  if (norm.includes('telegram') || norm.includes('tg ') || norm.includes('tg-')) return 'Telegram';
  if (norm.includes('tiktok') || norm.includes('tik tok')) return 'TikTok';
  if (norm.includes('twitter') || norm.includes('tweet') || norm.includes(' x ') || norm.includes('x.com')) return 'Twitter / X';
  if (norm.includes('spotify')) return 'Spotify';
  if (norm.includes('discord')) return 'Discord';
  if (norm.includes('twitch')) return 'Twitch';
  if (norm.includes('linkedin')) return 'LinkedIn';
  if (norm.includes('pinterest')) return 'Pinterest';
  if (norm.includes('snapchat') || norm.includes('snap ')) return 'Snapchat';
  if (norm.includes('reddit')) return 'Reddit';
  if (norm.includes('whatsapp')) return 'WhatsApp';
  if (norm.includes('google') || norm.includes('review') || norm.includes('gmaps')) return 'Google Maps';
  if (norm.includes('vimeo')) return 'Vimeo';
  if (norm.includes('soundcloud')) return 'SoundCloud';
  return 'Other Apps';
}

let memoryCachedServices: Service[] | null = null;

export async function callSmmApi(action: string, additionalParams: Record<string, any> = {}): Promise<any> {
  try {
    if (action === 'services') {
      const res = await fetch('/api/smm/services');
      const data = await res.json();
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        return data.services;
      }
      return CURATED_SERVICES;
    }
    if (action === 'balance') {
      const res = await fetch('/api/smm/balance', { method: 'POST' });
      return await res.json();
    }
    if (action === 'status') {
      const res = await fetch('/api/smm/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: additionalParams.order })
      });
      return await res.json();
    }
    if (action === 'add') {
      const res = await fetch('/api/smm/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: additionalParams.service,
          link: additionalParams.link,
          quantity: additionalParams.quantity
        })
      });
      return await res.json();
    }
    return CURATED_SERVICES;
  } catch (err: any) {
    console.error(`[SMM API Error] Action '${action}' failed:`, err);
    if (action === 'services') return CURATED_SERVICES;
    throw err;
  }
}

export async function syncAndCacheServicesFromProvider(): Promise<Service[]> {
  try {
    const res = await fetch('/api/smm/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profitPercentage: 25 })
    });
    const data = await res.json();
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      memoryCachedServices = data.services;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('smm_services_cache', JSON.stringify(data.services));
        } catch (e) {}
      }
      return data.services;
    }
  } catch (err) {
    console.error("Failed to sync services from provider:", err);
  }
  return await fetchSMMServices(true);
}

export async function fetchSMMServices(forceRefresh = false): Promise<Service[]> {
  if (!forceRefresh && memoryCachedServices && memoryCachedServices.length > 0) {
    return memoryCachedServices;
  }

  // Instant local cache resolution
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smm_services_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 800) {
          memoryCachedServices = parsed;
          // Background refresh to stay in sync
          setTimeout(() => {
            fetchSMMServices(true).catch(() => {});
          }, 1500);
          return parsed;
        }
      }
    } catch (e) {}
  }

  try {
    const url = '/api/smm/services' + (forceRefresh ? '?refresh=true' : '');
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      memoryCachedServices = data.services;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('smm_services_cache', JSON.stringify(data.services));
        } catch (e) {}
      }
      return data.services;
    }
  } catch (err) {
    console.error("fetchSMMServices error:", err);
  }

  return CURATED_SERVICES;
}

export async function placeSMMOrder(serviceId: string | number, link: string, quantity: number): Promise<any> {
  return await callSmmApi('add', { service: serviceId, link, quantity });
}

export async function checkSMMOrderStatus(orderId: string | number): Promise<any> {
  return await callSmmApi('status', { order: orderId });
}

export async function checkSMMUserBalance(): Promise<any> {
  return await callSmmApi('balance');
}
