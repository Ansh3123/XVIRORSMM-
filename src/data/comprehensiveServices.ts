export interface ServiceDefinition {
  id: string;
  category: string;
  name: string;
  rate: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  status: 'active' | 'inactive';
  desc: string;
  type?: string;
}

export const ALL_APP_SERVICES: ServiceDefinition[] = [
  // ==========================================
  // 1. INSTAGRAM SERVICES
  // ==========================================
  {
    id: "7001",
    category: "Instagram Followers [Guaranteed & Refill]",
    name: "Instagram Followers [100% Real Looking] - High Retention | 30 Days Refill ♻️ | Speed 20K/Day",
    rate: "35.00",
    price: 43.75,
    minOrder: 50,
    maxOrder: 1000000,
    status: "active",
    desc: "Start Time: 0-1 Hour\nSpeed: 20K/Day\nRefill: 30 Days Refill Guarantee\nQuality: High Quality Real Profiles with posts and stories\nLink: Profile URL (e.g. https://instagram.com/username)"
  },
  {
    id: "7002",
    category: "Instagram Followers [Guaranteed & Refill]",
    name: "Instagram Followers [Lifetime Non-Drop] - 100% Safe | 50K/Day | Lifetime Refill Button ♻️",
    rate: "48.00",
    price: 60.00,
    minOrder: 100,
    maxOrder: 2000000,
    status: "active",
    desc: "Start Time: Instant\nSpeed: 50K/Day\nGuarantee: Lifetime Refill\nQuality: Premium Aged Accounts\nLink: Profile URL"
  },
  {
    id: "7003",
    category: "Instagram Followers [Indian Target 🇮🇳]",
    name: "Instagram Followers [100% Indian Profiles 🇮🇳] - Real Active Users | 5K/Day | Low Drop",
    rate: "75.00",
    price: 93.75,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Target: 100% Indian Names & Bios 🇮🇳\nStart Time: 15-30 Mins\nRefill: 30 Days\nLink: Profile URL"
  },
  {
    id: "7004",
    category: "Instagram Likes [Instant & Non-Drop]",
    name: "Instagram Likes [Instant Start 🚀] - Superfast 100K/Day | 100% Non-Drop | HQ Accounts",
    rate: "4.50",
    price: 5.62,
    minOrder: 20,
    maxOrder: 500000,
    status: "active",
    desc: "Start: 0-5 Mins\nSpeed: 100K/Day\nQuality: High Quality Profiles\nLink: Post/Reel URL"
  },
  {
    id: "7005",
    category: "Instagram Likes [Indian Target 🇮🇳]",
    name: "Instagram Likes [100% Indian Real Profiles 🇮🇳] - With Active Stories | Instant Delivery",
    rate: "9.00",
    price: 11.25,
    minOrder: 20,
    maxOrder: 200000,
    status: "active",
    desc: "Target: 100% Indian Profiles 🇮🇳\nStart: Instant\nQuality: High Engagement\nLink: Post/Reel URL"
  },
  {
    id: "7006",
    category: "Instagram Reels Views [Viral Push 🚀]",
    name: "Instagram Reels Views [Algorithm Booster] - 5M/Day Speed | Reach + Impressions Included 📈",
    rate: "0.15",
    price: 0.19,
    minOrder: 100,
    maxOrder: 50000000,
    status: "active",
    desc: "Start: Instant\nSpeed: 5M-10M/Day\nExtra: Boosts Explore & Reels Algorithm with high retention\nLink: Reel URL"
  },
  {
    id: "7007",
    category: "Instagram Reels Views [Viral Push 🚀]",
    name: "Instagram Reels Views [Ultra Cheap Instant ⚡] - Non-Drop | All Links Supported",
    rate: "0.12",
    price: 0.15,
    minOrder: 100,
    maxOrder: 10000000,
    status: "active",
    desc: "Start: Instant\nCheapest rate in the market\nLink: Reel URL"
  },
  {
    id: "7008",
    category: "Instagram Comments [Custom & Emoji]",
    name: "Instagram Custom Comments [Write Your Own Text] - High Quality Profiles | 1 Comment Per Line",
    rate: "80.00",
    price: 100.00,
    minOrder: 5,
    maxOrder: 10000,
    status: "active",
    type: "Custom Comments",
    desc: "Enter 1 comment per line in the comments field.\nProfiles: Real looking profiles with avatars and posts.\nLink: Post/Reel URL"
  },
  {
    id: "7009",
    category: "Instagram Story Views & Reactions",
    name: "Instagram Story Views [All Active Stories] + Impressions & Profile Visits",
    rate: "3.50",
    price: 4.38,
    minOrder: 100,
    maxOrder: 500000,
    status: "active",
    desc: "Views all currently active stories on profile.\nLink: Profile URL or Story URL"
  },
  {
    id: "7010",
    category: "Instagram Live Stream Views",
    name: "Instagram Live Stream Viewers [30 Minutes Duration] - Stable Non-Drop Concurrent Viewers",
    rate: "45.00",
    price: 56.25,
    minOrder: 20,
    maxOrder: 5000,
    status: "active",
    desc: "Start: 1-3 Mins after stream starts\nDuration: 30 Minutes stable stay\nLink: Live Stream URL or Profile Username"
  },
  {
    id: "7011",
    category: "Instagram Saves & Shares",
    name: "Instagram Post Shares + Saves Combo [Explore Page Push 🚀]",
    rate: "2.50",
    price: 3.12,
    minOrder: 50,
    maxOrder: 500000,
    status: "active",
    desc: "Triggers Instagram algorithmic recommendations on Explore page.\nLink: Post or Reel URL"
  },

  // ==========================================
  // 2. YOUTUBE SERVICES
  // ==========================================
  {
    id: "7020",
    category: "YouTube Subscribers [Non-Drop & Monetizable]",
    name: "YouTube Subscribers [100% Non-Drop & Safe] - Real Active Accounts | 30 Days Refill ♻️ | 1K/Day",
    rate: "450.00",
    price: 562.50,
    minOrder: 20,
    maxOrder: 50000,
    status: "active",
    desc: "Start: 1-12 Hours\nSpeed: 500-1000/Day Natural Pace\nRefill: 30 Days Refill Button\nChannel must have at least 1 public video\nLink: Channel URL"
  },
  {
    id: "7021",
    category: "YouTube Subscribers [Non-Drop & Monetizable]",
    name: "YouTube Subscribers [Lifetime Guarantee ♻️] - Monetization Safe | 0% Drop Rate",
    rate: "650.00",
    price: 812.50,
    minOrder: 50,
    maxOrder: 20000,
    status: "active",
    desc: "Safe for YouTube Partner Program (YPP)\nLifetime Refill Guarantee\nLink: Channel URL"
  },
  {
    id: "7022",
    category: "YouTube Views [High Retention & SEO]",
    name: "YouTube High Retention Views [Suggested Videos & Search] - 2-5 Min Watch Time | Non-Drop",
    rate: "95.00",
    price: 118.75,
    minOrder: 100,
    maxOrder: 10000000,
    status: "active",
    desc: "Sources: YouTube Search, Suggested Videos, External\nRetention: 70-90% on videos up to 5 mins\nMonetizable & Safe\nLink: Video URL"
  },
  {
    id: "7023",
    category: "YouTube Watch Time Hours [Monetization]",
    name: "YouTube 4,000 Watch Time Hours Package [For 15+ Min Video] - Completes in 3-5 Days ⏱️",
    rate: "1200.00",
    price: 1500.00,
    minOrder: 500,
    maxOrder: 4000,
    status: "active",
    desc: "Video requirement: At least 1 video of 15+ minutes duration.\nCounts 100% towards YouTube 4,000 Hours Monetization threshold.\nLink: Video URL"
  },
  {
    id: "7024",
    category: "YouTube Likes & Comments",
    name: "YouTube Video Likes [Instant High Quality] - Non-Drop | Fast Delivery 🚀",
    rate: "30.00",
    price: 37.50,
    minOrder: 50,
    maxOrder: 200000,
    status: "active",
    desc: "Start: Instant\nQuality: High Quality Profiles\nLink: Video URL"
  },
  {
    id: "7025",
    category: "YouTube Shorts Views & Likes",
    name: "YouTube Shorts Views [Instant Algorithm Viral Boost] - 100K/Day | High Retention 📱",
    rate: "25.00",
    price: 31.25,
    minOrder: 100,
    maxOrder: 5000000,
    status: "active",
    desc: "Start: 0-15 Mins\nSpeed: 100K/Day\nHelps Shorts land on the Shorts Feed algorithm\nLink: Shorts URL"
  },
  {
    id: "7026",
    category: "YouTube Live Stream Views",
    name: "YouTube Live Stream Viewers [60 Minutes Duration] - Stable Concurrent Watchers 🔴",
    rate: "120.00",
    price: 150.00,
    minOrder: 20,
    maxOrder: 10000,
    status: "active",
    desc: "Start: 2-5 Mins\nDuration: 60 Minutes concurrent viewers\nLink: YouTube Live Stream URL"
  },
  {
    id: "7027",
    category: "YouTube Comments [Custom]",
    name: "YouTube Custom Comments [Real Profiles] - 1 Comment Per Line",
    rate: "120.00",
    price: 150.00,
    minOrder: 5,
    maxOrder: 5000,
    status: "active",
    type: "Custom Comments",
    desc: "1 Comment per line. Real aged accounts with profile pictures.\nLink: YouTube Video URL"
  },

  // ==========================================
  // 3. FACEBOOK SERVICES
  // ==========================================
  {
    id: "7030",
    category: "Facebook Page Likes & Followers",
    name: "Facebook Page Likes + Followers [New Page Experience] - 100% Real Looking | 30 Days Refill ♻️",
    rate: "60.00",
    price: 75.00,
    minOrder: 100,
    maxOrder: 1000000,
    status: "active",
    desc: "Supports both Classic and New Page Experience.\nIncreases both Likes and Followers count.\nLink: Facebook Page URL"
  },
  {
    id: "7031",
    category: "Facebook Profile Followers",
    name: "Facebook Profile Followers [Professional Mode / Personal] - Non-Drop | Speed 10K/Day",
    rate: "55.00",
    price: 68.75,
    minOrder: 50,
    maxOrder: 500000,
    status: "active",
    desc: "Works on Personal Profiles and Professional Mode.\nMake sure 'Who can follow me' is set to Public.\nLink: Facebook Profile URL"
  },
  {
    id: "7032",
    category: "Facebook Post Reactions [Love, Care, Wow, Haha]",
    name: "Facebook Post Reactions [Choose Reaction: ❤️ Love / 🥰 Care / 😂 Haha / 😮 Wow] - Instant",
    rate: "18.00",
    price: 22.50,
    minOrder: 20,
    maxOrder: 100000,
    status: "active",
    desc: "Start: Instant (0-5 Mins)\nHigh quality natural distribution.\nLink: Facebook Public Post URL"
  },
  {
    id: "7033",
    category: "Facebook Video & Reels Views",
    name: "Facebook Video & Reels Views [60K Minutes Monetization Boost] - High Retention",
    rate: "8.50",
    price: 10.62,
    minOrder: 100,
    maxOrder: 10000000,
    status: "active",
    desc: "Counts for Facebook In-Stream Ads 60,000 Eligible Minutes Watch Time.\nLink: Video / Reel URL"
  },
  {
    id: "7034",
    category: "Facebook Group Members",
    name: "Facebook Group Members [Public & Private Groups] - Real Accounts | 5K/Day",
    rate: "70.00",
    price: 87.50,
    minOrder: 100,
    maxOrder: 200000,
    status: "active",
    desc: "Supports Public and Private Facebook Groups.\nIf private, make sure auto-accept is enabled or admins accept requests.\nLink: Group URL"
  },
  {
    id: "7035",
    category: "Facebook Post Shares",
    name: "Facebook Post Shares to Public Profiles & Groups [Viral Reach]",
    rate: "22.00",
    price: 27.50,
    minOrder: 25,
    maxOrder: 100000,
    status: "active",
    desc: "Boosts post virality and organic feed appearance.\nLink: Facebook Post URL"
  },

  // ==========================================
  // 4. TELEGRAM SERVICES
  // ==========================================
  {
    id: "7040",
    category: "Telegram Channel & Group Members",
    name: "Telegram Channel/Group Members [0% Drop Non-Drop] - 30 Days Refill ♻️ | Speed 20K/Day",
    rate: "45.00",
    price: 56.25,
    minOrder: 100,
    maxOrder: 500000,
    status: "active",
    desc: "Start: Instant to 30 mins\nSpeed: Up to 20,000/day\nRefill: 30 Days Automatic Refill\nLink: Channel/Group Public or Private Invite Link"
  },
  {
    id: "7041",
    category: "Telegram Channel & Group Members",
    name: "Telegram Channel Members [100% Indian Members 🇮🇳] - Real Looking Active Profiles",
    rate: "70.00",
    price: 87.50,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Target: Indian audience names and profiles 🇮🇳\nStart: 15-60 Mins\nLink: Channel Link"
  },
  {
    id: "7042",
    category: "Telegram Post Views & Reactions",
    name: "Telegram Post Views [Instant Delivery ⚡] - Last 1 Post / Any Public Link",
    rate: "0.80",
    price: 1.00,
    minOrder: 100,
    maxOrder: 2000000,
    status: "active",
    desc: "Start: Instant (0-2 Mins)\nSpeed: 50K/Hour\nLink: Telegram Post Link (e.g. https://t.me/channel/123)"
  },
  {
    id: "7043",
    category: "Telegram Post Views & Reactions",
    name: "Telegram Post Positive Reactions [👍 ❤️ 🔥 🎉 🚀] - Mixed or Selected",
    rate: "3.50",
    price: 4.38,
    minOrder: 20,
    maxOrder: 50000,
    status: "active",
    desc: "Delivers positive emoji reactions directly on target post.\nLink: Telegram Post Link"
  },
  {
    id: "7044",
    category: "Telegram Premium Boosts [Level Up]",
    name: "Telegram Channel Boosts [Level 1 to 10] - Unlock Custom Stories & Perks 🚀",
    rate: "180.00",
    price: 225.00,
    minOrder: 1,
    maxOrder: 100,
    status: "active",
    desc: "Provides Telegram Premium Boosts to level up your channel.\nLink: Channel Boost Link (e.g. https://t.me/boost/channelname)"
  },
  {
    id: "7045",
    category: "Telegram Poll Votes",
    name: "Telegram Poll Votes [Instant Delivery] - Fast & Safe",
    rate: "12.00",
    price: 15.00,
    minOrder: 50,
    maxOrder: 50000,
    status: "active",
    desc: "Format: Put poll post URL with option number (e.g. https://t.me/channel/123?option=1)\nLink: Telegram Poll Post URL"
  },

  // ==========================================
  // 5. TIKTOK SERVICES
  // ==========================================
  {
    id: "7050",
    category: "TikTok Followers [Instant & High Quality]",
    name: "TikTok Followers [Real Looking Accounts] - Instant Start ⚡ | 30 Days Refill ♻️ | 10K/Day",
    rate: "90.00",
    price: 112.50,
    minOrder: 50,
    maxOrder: 200000,
    status: "active",
    desc: "Start: 0-30 Mins\nSpeed: 10K/Day\nRefill: 30 Days Refill Guarantee\nLink: TikTok Profile Link (e.g. https://www.tiktok.com/@username)"
  },
  {
    id: "7051",
    category: "TikTok Video Likes",
    name: "TikTok Video Likes [Instant Start 🚀] - Superfast 50K/Day | 100% Non-Drop",
    rate: "25.00",
    price: 31.25,
    minOrder: 50,
    maxOrder: 500000,
    status: "active",
    desc: "Start: Instant (0-5 Mins)\nQuality: High Quality Profiles\nLink: TikTok Video Link"
  },
  {
    id: "7052",
    category: "TikTok Video Views [ForYou Push]",
    name: "TikTok Video Views [FYP Algorithm Booster 🔥] - 1M/Day Speed | High Retention",
    rate: "0.40",
    price: 0.50,
    minOrder: 100,
    maxOrder: 10000000,
    status: "active",
    desc: "Start: Instant\nSpeed: 1M-5M/Day\nBoosts chances to get on the For You Page\nLink: TikTok Video Link"
  },
  {
    id: "7053",
    category: "TikTok Shares & Saves",
    name: "TikTok Video Shares + Favorites / Saves [Algorithm Multiplier]",
    rate: "3.00",
    price: 3.75,
    minOrder: 50,
    maxOrder: 500000,
    status: "active",
    desc: "Increases share & save metrics to trigger TikTok viral ranking.\nLink: TikTok Video Link"
  },
  {
    id: "7054",
    category: "TikTok Custom Comments",
    name: "TikTok Custom Comments [Real Profiles] - 1 Comment Per Line",
    rate: "95.00",
    price: 118.75,
    minOrder: 5,
    maxOrder: 5000,
    status: "active",
    type: "Custom Comments",
    desc: "1 Comment per line. Real profiles with avatar and bio.\nLink: TikTok Video Link"
  },
  {
    id: "7055",
    category: "TikTok Live Stream Viewers",
    name: "TikTok Live Stream Viewers [30 Minutes Duration] - Stable Watchers 🔴",
    rate: "60.00",
    price: 75.00,
    minOrder: 20,
    maxOrder: 5000,
    status: "active",
    desc: "Start: 1-5 Mins\nDuration: 30 Minutes\nLink: TikTok Live URL"
  },

  // ==========================================
  // 6. TWITTER / X SERVICES
  // ==========================================
  {
    id: "7060",
    category: "Twitter / X Followers",
    name: "Twitter / X Followers [High Quality with Avatars & Bios] - Non-Drop | 5K/Day | 30 Days Refill ♻️",
    rate: "120.00",
    price: 150.00,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Start: 0-2 Hours\nSpeed: 5K/Day\nQuality: Profiles with realistic bios, tweets, and avatars.\nLink: Profile URL (e.g. https://x.com/username)"
  },
  {
    id: "7061",
    category: "Twitter / X Retweets & Likes",
    name: "Twitter / X Retweets / Reposts [Instant Start 🚀] - 100% Safe & Stable",
    rate: "35.00",
    price: 43.75,
    minOrder: 20,
    maxOrder: 50000,
    status: "active",
    desc: "Start: Instant (0-10 Mins)\nSpeed: 10K/Day\nLink: Tweet / Post URL"
  },
  {
    id: "7062",
    category: "Twitter / X Retweets & Likes",
    name: "Twitter / X Post Likes [Fast Delivery ⚡] - Non-Drop | High Quality",
    rate: "30.00",
    price: 37.50,
    minOrder: 20,
    maxOrder: 50000,
    status: "active",
    desc: "Start: Instant\nSpeed: 15K/Day\nLink: Tweet / Post URL"
  },
  {
    id: "7063",
    category: "Twitter / X Impressions & Poll Votes",
    name: "Twitter / X Tweet Impressions & Views [Viral Boost 📈] - Instant 500K/Day",
    rate: "0.80",
    price: 1.00,
    minOrder: 100,
    maxOrder: 10000000,
    status: "active",
    desc: "Skyrockets tweet impression counters for public visibility and monetization eligibility.\nLink: Tweet URL"
  },
  {
    id: "7064",
    category: "Twitter / X Impressions & Poll Votes",
    name: "Twitter / X Poll Votes [Superfast Delivery] - Choose Option 1, 2, 3, or 4",
    rate: "40.00",
    price: 50.00,
    minOrder: 50,
    maxOrder: 50000,
    status: "active",
    desc: "Specify option choice in order link or remarks (e.g. https://x.com/user/status/123?option=1)\nLink: Poll Tweet URL"
  },
  {
    id: "7065",
    category: "Twitter / X Bookmarks & Space",
    name: "Twitter / X Post Bookmarks [High Quality Accounts] - Algorithm Booster",
    rate: "15.00",
    price: 18.75,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Bookmarks heavily influence Twitter X recommendation engine.\nLink: Tweet URL"
  },

  // ==========================================
  // 7. SPOTIFY SERVICES
  // ==========================================
  {
    id: "7070",
    category: "Spotify Plays & Streams [Royalty Eligible]",
    name: "Spotify Track Plays [Global / USA HQ Streams] - Non-Drop | Royalty Eligible 🎵 | 10K/Day",
    rate: "45.00",
    price: 56.25,
    minOrder: 500,
    maxOrder: 1000000,
    status: "active",
    desc: "Start: 0-6 Hours\nSpeed: 10K-20K/Day\nRetention: 90-120 seconds (Full Play)\nSafe for royalties and monetization\nLink: Spotify Track URL"
  },
  {
    id: "7071",
    category: "Spotify Plays & Streams [Royalty Eligible]",
    name: "Spotify Artist & Playlist Followers [Verified HQ Profiles] - 30 Days Refill ♻️",
    rate: "50.00",
    price: 62.50,
    minOrder: 100,
    maxOrder: 500000,
    status: "active",
    desc: "Start: 0-12 Hours\nRefill: 30 Days\nLink: Spotify Artist or Playlist URL"
  },
  {
    id: "7072",
    category: "Spotify Monthly Listeners",
    name: "Spotify Monthly Listeners Boost [Algorithmic Discovery] - Safe & Non-Drop",
    rate: "60.00",
    price: 75.00,
    minOrder: 500,
    maxOrder: 500000,
    status: "active",
    desc: "Directly improves your public Monthly Listeners count on your artist page.\nLink: Spotify Artist URL"
  },
  {
    id: "7073",
    category: "Spotify Plays & Streams [Royalty Eligible]",
    name: "Spotify USA Targeted Track Plays [100% USA Premium Listeners] 🇺🇸",
    rate: "75.00",
    price: 93.75,
    minOrder: 500,
    maxOrder: 500000,
    status: "active",
    desc: "Targeted streams from verified USA IP addresses. Top tier royalty payout rates.\nLink: Spotify Track URL"
  },
  {
    id: "7074",
    category: "Spotify Saves & Pre-Saves",
    name: "Spotify Track Saves & Playlist Adds [Organic Algorithmic Push]",
    rate: "40.00",
    price: 50.00,
    minOrder: 100,
    maxOrder: 100000,
    status: "active",
    desc: "Increases save rate to trigger Discover Weekly and Release Radar placements.\nLink: Spotify Track URL"
  },

  // ==========================================
  // 8. DISCORD SERVICES
  // ==========================================
  {
    id: "7080",
    category: "Discord Server Members",
    name: "Discord Server Members [Realistic Profiles & Avatars] - Instant Start ⚡ | 0% Drop",
    rate: "110.00",
    price: 137.50,
    minOrder: 50,
    maxOrder: 50000,
    status: "active",
    desc: "Start: Instant (0-15 Mins)\nSpeed: 5K/Day\nRequirements: Create a permanent invite link without expiry.\nLink: Discord Invite Link (e.g. https://discord.gg/code)"
  },
  {
    id: "7081",
    category: "Discord Server Members",
    name: "Discord Online Server Members [Voice & Chat Active] - 30 Days Refill ♻️",
    rate: "220.00",
    price: 275.00,
    minOrder: 50,
    maxOrder: 20000,
    status: "active",
    desc: "Members stay online with green status indicators.\nRefill: 30 Days\nLink: Discord Invite Link"
  },
  {
    id: "7082",
    category: "Discord Server Boosts",
    name: "Discord Server Boosts [Level 1 / Level 2 / Level 3] - 1 Month / 30 Days Duration 🚀",
    rate: "450.00",
    price: 562.50,
    minOrder: 2,
    maxOrder: 14,
    status: "active",
    desc: "Delivers Server Boosts to unlock 1080p stream quality, custom invite banners, 100+ emoji slots.\nQuantity 2 = Level 1, Quantity 7 = Level 2, Quantity 14 = Level 3.\nLink: Discord Invite Link"
  },
  {
    id: "7083",
    category: "Discord Server Boosts",
    name: "Discord Server Boosts [3 Months Duration Package] - Stable & Guaranteed",
    rate: "950.00",
    price: 1187.50,
    minOrder: 2,
    maxOrder: 14,
    status: "active",
    desc: "Full 3-month server boost duration without any drops.\nLink: Discord Invite Link"
  },

  // ==========================================
  // 9. TWITCH SERVICES
  // ==========================================
  {
    id: "7090",
    category: "Twitch Followers & Views",
    name: "Twitch Channel Followers [High Quality Real Looking] - Instant Start 🚀 | Non-Drop",
    rate: "60.00",
    price: 75.00,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Start: 0-10 Mins\nSpeed: 10K/Day\nSafe for Twitch Affiliate and Partner applications.\nLink: Twitch Channel URL (e.g. https://twitch.tv/username)"
  },
  {
    id: "7091",
    category: "Twitch Live Stream Viewers",
    name: "Twitch Live Stream Viewers [60 Minutes Duration] - Stable Concurrent Viewers ⚡",
    rate: "150.00",
    price: 187.50,
    minOrder: 20,
    maxOrder: 5000,
    status: "active",
    desc: "Start: 2-5 Mins\nDuration: 60 Minutes stable concurrent presence\nHelps boost channel to top of category directory.\nLink: Twitch Channel URL"
  },
  {
    id: "7092",
    category: "Twitch Video & Clip Views",
    name: "Twitch Clip & VOD Video Views [Fast Algorithm Ranking]",
    rate: "15.00",
    price: 18.75,
    minOrder: 100,
    maxOrder: 1000000,
    status: "active",
    desc: "Start: Instant\nLink: Twitch Clip or VOD URL"
  },
  {
    id: "7093",
    category: "Twitch Live Stream Viewers",
    name: "Twitch Live Stream Viewers [120 Minutes / 2 Hours Duration] - Non-Drop ⚡",
    rate: "260.00",
    price: 325.00,
    minOrder: 20,
    maxOrder: 3000,
    status: "active",
    desc: "Start: 2-5 Mins\nDuration: 120 Minutes continuous viewing\nLink: Twitch Channel URL"
  },

  // ==========================================
  // 10. LINKEDIN SERVICES
  // ==========================================
  {
    id: "7100",
    category: "LinkedIn Followers & Connections",
    name: "LinkedIn Company Page Followers [100% Real Professionals] - Non-Drop | Lifetime Refill ♻️",
    rate: "380.00",
    price: 475.00,
    minOrder: 50,
    maxOrder: 25000,
    status: "active",
    desc: "Start: 1-6 Hours\nProfiles: Worldwide corporate accounts with real experience and connections.\nLink: LinkedIn Company Page URL"
  },
  {
    id: "7101",
    category: "LinkedIn Followers & Connections",
    name: "LinkedIn Personal Profile Followers & Connections [HQ Business Accounts]",
    rate: "450.00",
    price: 562.50,
    minOrder: 25,
    maxOrder: 10000,
    status: "active",
    desc: "Start: 2-12 Hours\nSafe pacing to protect account reputation.\nLink: LinkedIn Profile URL"
  },
  {
    id: "7102",
    category: "LinkedIn Post Likes & Reposts",
    name: "LinkedIn Post Likes & Reactions [Like 👍 / Celebrate 👏 / Insightful 💡] - Professional",
    rate: "95.00",
    price: 118.75,
    minOrder: 20,
    maxOrder: 20000,
    status: "active",
    desc: "Start: 15-30 Mins\nHigh corporate appeal for thought leadership content.\nLink: LinkedIn Post URL"
  },
  {
    id: "7103",
    category: "LinkedIn Post Likes & Reposts",
    name: "LinkedIn Post Reposts & Custom Business Comments [Corporate Quality]",
    rate: "210.00",
    price: 262.50,
    minOrder: 10,
    maxOrder: 5000,
    status: "active",
    desc: "Increases B2B distribution and organic algorithmic impressions on LinkedIn feed.\nLink: LinkedIn Post URL"
  },

  // ==========================================
  // 11. PINTEREST SERVICES
  // ==========================================
  {
    id: "7110",
    category: "Pinterest Followers & Repins",
    name: "Pinterest Account & Board Followers [Real Organic Engagement] 📌 | Non-Drop",
    rate: "80.00",
    price: 100.00,
    minOrder: 50,
    maxOrder: 50000,
    status: "active",
    desc: "Start: 0-2 Hours\nSpeed: 2K/Day\nLink: Pinterest Profile or Board URL"
  },
  {
    id: "7111",
    category: "Pinterest Followers & Repins",
    name: "Pinterest Pin Repins / Saves + Outbound Clicks [Viral Reach Boost] 📌",
    rate: "45.00",
    price: 56.25,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Triggers Pinterest visual algorithm to display pins on Smart Feed.\nLink: Pin URL"
  },
  {
    id: "7112",
    category: "Pinterest Impressions",
    name: "Pinterest Pin Views & Impressions [100% Safe Fast Push]",
    rate: "12.00",
    price: 15.00,
    minOrder: 100,
    maxOrder: 500000,
    status: "active",
    desc: "Increases pin analytics and monthly views count.\nLink: Pin URL"
  },

  // ==========================================
  // 12. SNAPCHAT SERVICES
  // ==========================================
  {
    id: "7120",
    category: "Snapchat Spotlight & Followers",
    name: "Snapchat Public Profile Followers [High Quality Global Accounts] 👻 | 30 Days Refill ♻️",
    rate: "180.00",
    price: 225.00,
    minOrder: 50,
    maxOrder: 50000,
    status: "active",
    desc: "Start: 1-12 Hours\nProfile must be a Public Profile on Snapchat.\nLink: Snapchat Profile URL or Username"
  },
  {
    id: "7121",
    category: "Snapchat Spotlight & Followers",
    name: "Snapchat Spotlight & Story Views [Superfast Viral Delivery] 👻 - High Retention",
    rate: "15.00",
    price: 18.75,
    minOrder: 100,
    maxOrder: 500000,
    status: "active",
    desc: "Start: Instant (0-15 Mins)\nSpeed: 50K/Day\nLink: Spotlight URL or Story Link"
  },
  {
    id: "7122",
    category: "Snapchat Spotlight & Followers",
    name: "Snapchat Lens & Filter Plays [Viral Creator Boost]",
    rate: "25.00",
    price: 31.25,
    minOrder: 100,
    maxOrder: 200000,
    status: "active",
    desc: "Increases lens play count in Snapchat Lens Explorer.\nLink: Snapchat Lens URL"
  },

  // ==========================================
  // 13. REDDIT SERVICES
  // ==========================================
  {
    id: "7130",
    category: "Reddit Upvotes & Members",
    name: "Reddit Post Upvotes [Safe Spaced Algorithm Simulation ⬆️] - Non-Drop",
    rate: "350.00",
    price: 437.50,
    minOrder: 20,
    maxOrder: 5000,
    status: "active",
    desc: "Start: 15-45 Mins\nPacing: Delivered organically with aged Reddit accounts with high karma.\nLink: Reddit Post URL"
  },
  {
    id: "7131",
    category: "Reddit Upvotes & Members",
    name: "Reddit Subreddit Subscribers / Members [Permanent & Stable]",
    rate: "280.00",
    price: 350.00,
    minOrder: 50,
    maxOrder: 20000,
    status: "active",
    desc: "Start: 1-6 Hours\nLink: Subreddit URL (e.g. https://reddit.com/r/community)"
  },
  {
    id: "7132",
    category: "Reddit Upvotes & Members",
    name: "Reddit Comment Upvotes [Aged Profiles / Safe Pacing ⬆️]",
    rate: "320.00",
    price: 400.00,
    minOrder: 15,
    maxOrder: 3000,
    status: "active",
    desc: "Boosts specific comments to top of thread discussion.\nLink: Direct Comment URL"
  },

  // ==========================================
  // 14. WHATSAPP SERVICES
  // ==========================================
  {
    id: "7140",
    category: "WhatsApp Channel Members & Reactions",
    name: "WhatsApp Channel Followers / Subscribers [100% Non-Drop & Permanent] 🟢",
    rate: "95.00",
    price: 118.75,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Start: 0-1 Hour\nSpeed: 5K/Day\nPermanent members for WhatsApp Channels.\nLink: WhatsApp Channel Public Link"
  },
  {
    id: "7141",
    category: "WhatsApp Channel Members & Reactions",
    name: "WhatsApp Channel Post Emoji Reactions [👍 ❤️ 🔥 👏 🎉] - Instant Delivery",
    rate: "25.00",
    price: 31.25,
    minOrder: 20,
    maxOrder: 50000,
    status: "active",
    desc: "Start: Instant\nLink: WhatsApp Channel Post Link"
  },
  {
    id: "7142",
    category: "WhatsApp Group Members",
    name: "WhatsApp Group Members [Real Looking Profiles] - 0% Drop",
    rate: "140.00",
    price: 175.00,
    minOrder: 25,
    maxOrder: 1024,
    status: "active",
    desc: "Max 1024 members per group limit.\nLink: WhatsApp Group Invite Link"
  },

  // ==========================================
  // 15. GOOGLE MAPS & BUSINESS SERVICES
  // ==========================================
  {
    id: "7150",
    category: "Google Maps & Business Reviews",
    name: "Google Maps 5-Star Reviews with Custom Text [Local Guide Profiles] ⭐⭐⭐⭐⭐",
    rate: "650.00",
    price: 812.50,
    minOrder: 5,
    maxOrder: 500,
    status: "active",
    type: "Custom Comments",
    desc: "1 Review per line. High trust Local Guide accounts (Level 4-7).\nSafe drip delivery 1-3 reviews per day to prevent spam flags.\nLink: Google Maps Business Place URL"
  },
  {
    id: "7151",
    category: "Google Maps & Business Reviews",
    name: "Google Business Profile Views & Directions Requests [Local SEO Rank Push]",
    rate: "80.00",
    price: 100.00,
    minOrder: 50,
    maxOrder: 10000,
    status: "active",
    desc: "Simulates local searchers clicking Directions, Call, and Website on your Google Business profile.\nLink: Google Business Maps URL"
  },
  {
    id: "7152",
    category: "Google Maps & Business Reviews",
    name: "Google Maps Local Guide 5-Star Rating Only [No Text] ⭐⭐⭐⭐⭐",
    rate: "420.00",
    price: 525.00,
    minOrder: 5,
    maxOrder: 1000,
    status: "active",
    desc: "Delivers clean 5-star ratings from active local Google accounts.\nLink: Google Maps Business URL"
  },

  // ==========================================
  // 16. THREADS SERVICES
  // ==========================================
  {
    id: "7160",
    category: "Threads Followers & Likes",
    name: "Threads Followers [Real Active Accounts] - Instant Start ⚡ | 30 Days Refill ♻️",
    rate: "60.00",
    price: 75.00,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Start: 0-30 Mins\nSpeed: 10K/Day\nRefill: 30 Days Refill Guarantee\nLink: Threads Profile URL (e.g. https://www.threads.net/@username)"
  },
  {
    id: "7161",
    category: "Threads Followers & Likes",
    name: "Threads Post Likes & Reposts [Fast Organic Delivery] 🧵",
    rate: "20.00",
    price: 25.00,
    minOrder: 25,
    maxOrder: 50000,
    status: "active",
    desc: "Start: Instant\nLink: Threads Post URL"
  },
  {
    id: "7162",
    category: "Threads Custom Comments",
    name: "Threads Custom Comments [High Quality Accounts] - 1 Comment Per Line",
    rate: "110.00",
    price: 137.50,
    minOrder: 5,
    maxOrder: 5000,
    status: "active",
    type: "Custom Comments",
    desc: "1 Comment per line. Real profiles with Threads activity.\nLink: Threads Post URL"
  },

  // ==========================================
  // 17. SOUNDCLOUD SERVICES
  // ==========================================
  {
    id: "7170",
    category: "SoundCloud Plays & Followers",
    name: "SoundCloud Track Plays [Worldwide HQ Listeners] - Ultra Fast 100K/Day 🎵",
    rate: "15.00",
    price: 18.75,
    minOrder: 500,
    maxOrder: 2000000,
    status: "active",
    desc: "Start: Instant (0-15 Mins)\nSpeed: 100K/Day\nSafe for royalties and track charts.\nLink: SoundCloud Track URL"
  },
  {
    id: "7171",
    category: "SoundCloud Plays & Followers",
    name: "SoundCloud Artist Followers & Track Likes [Real Looking Profiles] ♻️",
    rate: "35.00",
    price: 43.75,
    minOrder: 50,
    maxOrder: 100000,
    status: "active",
    desc: "Start: 0-1 Hour\nRefill: 30 Days\nLink: SoundCloud Profile or Track URL"
  },
  {
    id: "7172",
    category: "SoundCloud Reposts & Downloads",
    name: "SoundCloud Track Reposts [Viral Organic Signal 🔁]",
    rate: "25.00",
    price: 31.25,
    minOrder: 50,
    maxOrder: 50000,
    status: "active",
    desc: "Delivers reposts from active music accounts.\nLink: SoundCloud Track URL"
  },

  // ==========================================
  // 18. VIMEO SERVICES
  // ==========================================
  {
    id: "7180",
    category: "Vimeo Video Views",
    name: "Vimeo High Retention Video Views [Direct & Embed Views] - Lifetime Guarantee ♻️",
    rate: "30.00",
    price: 37.50,
    minOrder: 100,
    maxOrder: 500000,
    status: "active",
    desc: "Start: 0-2 Hours\nSpeed: 10K/Day\nHigh retention watch time.\nLink: Vimeo Video URL"
  },
  {
    id: "7181",
    category: "Vimeo Video Views",
    name: "Vimeo Video Likes & Channel Followers [HQ Verified Profiles]",
    rate: "70.00",
    price: 87.50,
    minOrder: 25,
    maxOrder: 50000,
    status: "active",
    desc: "Start: 1-6 Hours\nLink: Vimeo Video or Channel URL"
  }
];
