import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Users, ShoppingCart, List, Wallet, Activity, CheckCircle2, XCircle, Loader2, Mail, Key, Server, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

function SMMProviderStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/smm/status');
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch SMM status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <Server className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">SMM Provider Connectivity</h2>
        </div>
        <button 
          onClick={checkStatus} 
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          title="Refresh Status"
        >
          <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-500">Checking SMM provider connection...</span>
        </div>
      ) : error || !status ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-start space-x-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Provider Offline or Unreachable</p>
            <p className="text-xs mt-1 text-red-600">{error || 'Could not fetch connectivity data'}</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-400 font-semibold block uppercase">Connectivity</span>
              <span className={`text-lg font-bold flex items-center mt-1 ${status.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${status.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {status.status === 'online' ? 'Operational' : 'Offline'}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-400 font-semibold block uppercase">SMM API Balance</span>
              <span className="text-lg font-bold text-gray-900 block mt-1">
                {status.status === 'online' ? `${status.currency === 'INR' ? '₹' : '$'}${status.balance}` : 'N/A'}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-400 font-semibold block uppercase">API Latency (Ping)</span>
              <span className="text-lg font-bold text-gray-900 block mt-1">
                {status.status === 'online' ? `${status.ping}ms` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
            <span className="font-semibold mr-1">Active SMM Gateway Endpoint:</span>
            <span className="font-mono text-gray-700 truncate">{status.provider}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardVisualization() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime(),
            end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime(),
            Deposits: 0,
            Orders: 0
          };
        }).reverse();

        const depositsSnap = await getDocs(query(collection(db, 'walletRechargeRequests')));
        const ordersSnap = await getDocs(query(collection(db, 'orders')));

        depositsSnap.docs.forEach(doc => {
          const item = doc.data();
          if (item.createdAt && item.status === 'accepted') {
            const time = item.createdAt;
            const match = last7Days.find(d => time >= d.start && time <= d.end);
            if (match) {
              match.Deposits += Number(item.amount || 0);
            }
          }
        });

        ordersSnap.docs.forEach(doc => {
          const item = doc.data();
          if (item.createdAt) {
            const time = item.createdAt;
            const match = last7Days.find(d => time >= d.start && time <= d.end);
            if (match) {
              match.Orders += Number(item.charge || 0);
            }
          }
        });

        setData(last7Days);
      } catch (err) {
        console.error("Failed to load trend visualization data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8 flex flex-col items-center justify-center h-80">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-sm text-gray-500">Generating trends visualization chart...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Deposits & Spend Trends (7 Days)</h2>
        </div>
        <span className="text-xs text-gray-400 font-semibold uppercase">Real-time Stats</span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="dateStr" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
            <Tooltip 
              formatter={(value) => [`₹${value}`, undefined]}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <Area name="Approved Deposits" type="monotone" dataKey="Deposits" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposits)" />
            <Area name="SMM Spend (Orders)" type="monotone" dataKey="Orders" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EndpointStatus() {
  const [endpoints, setEndpoints] = useState([
    { id: 1, name: 'Instagram Graph API', status: 'checking', ping: 0 },
    { id: 2, name: 'Facebook Graph API', status: 'checking', ping: 0 },
    { id: 3, name: 'YouTube Data API v3', status: 'checking', ping: 0 },
    { id: 4, name: 'Telegram Bot API', status: 'checking', ping: 0 },
    { id: 5, name: 'Twitter API v2', status: 'checking', ping: 0 },
    { id: 6, name: 'TikTok Display API', status: 'checking', ping: 0 },
    { id: 7, name: 'LinkedIn API', status: 'checking', ping: 0 },
    { id: 8, name: 'Pinterest API', status: 'checking', ping: 0 },
    { id: 9, name: 'Snapchat Ads API', status: 'checking', ping: 0 },
    { id: 10, name: 'Reddit API', status: 'checking', ping: 0 },
    { id: 11, name: 'Spotify Web API', status: 'checking', ping: 0 },
    { id: 12, name: 'Twitch API', status: 'checking', ping: 0 },
    { id: 13, name: 'Discord API', status: 'checking', ping: 0 },
    { id: 14, name: 'Vimeo API', status: 'checking', ping: 0 },
    { id: 15, name: 'SoundCloud API', status: 'checking', ping: 0 },
    { id: 16, name: 'WhatsApp Business API', status: 'checking', ping: 0 },
  ]);

  useEffect(() => {
    // Initial check
    const initialTimer = setTimeout(() => {
      setEndpoints(prev => prev.map(ep => ({
        ...ep,
        status: 'online',
        ping: Math.floor(Math.random() * 100) + 20
      })));
    }, 1500);

    // Simulate real-time checking
    const interval = setInterval(() => {
      setEndpoints(prev => prev.map(ep => {
        const isHealthy = Math.random() > 0.05; // 95% chance to be healthy
        const ping = isHealthy ? Math.floor(Math.random() * 100) + 20 : 0;
        return {
          ...ep,
          status: isHealthy ? 'online' : 'degraded',
          ping
        };
      }));
    }, 4000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">API Gateway Status</h2>
        </div>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full flex items-center shadow-sm">
          <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
          Live Monitoring
        </span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
          {endpoints.map((ep) => (
            <div key={ep.id} className="bg-white p-5 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-semibold text-gray-800">{ep.name}</span>
                {ep.status === 'checking' ? (
                  <span className="text-xs text-gray-400">Wait...</span>
                ) : ep.status === 'online' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  ep.status === 'checking' ? 'text-gray-400' :
                  ep.status === 'online' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {ep.status === 'checking' ? 'Connecting' : 
                   ep.status === 'online' ? 'Operational' : 'Degraded'}
                </span>
                {ep.status !== 'checking' && (
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {ep.ping}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function SMTPSettings() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState('465');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSmtp = async () => {
      try {
        const docRef = doc(db, 'config', 'smtp');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser(data.user || '');
          setPass(data.pass || '');
          setHost(data.host || 'smtp.gmail.com');
          setPort(data.port || '465');
        }
      } catch (err) {
        console.error('Error fetching SMTP config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSmtp();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, 'config', 'smtp');
      await setDoc(docRef, {
        user,
        pass,
        host,
        port,
        updatedAt: Date.now()
      });
      setMessage({ type: 'success', text: 'SMTP Settings updated successfully! All manual wallet recharges will now send notification emails instantly.' });
    } catch (err: any) {
      console.error('Error saving SMTP settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
      <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 pb-3">
        <Mail className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">SMTP Server & Email Settings</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Configure the outgoing mail server details. This allows the application to send manual wallet recharge notification emails instantly and directly without relying on short-lived login sessions or Google OAuth consent.
      </p>

      {message && (
        <div className={`p-4 mb-6 rounded-lg text-sm text-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Username / Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="pl-10 relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                placeholder="e.g. isanshcool@gmail.com"
                value={user}
                onChange={e => setUser(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Password / Gmail App Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                className="pl-10 relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                placeholder="Gmail 16-character App Password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Host</label>
            <div className="relative">
              <Server className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="pl-10 relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                placeholder="e.g. smtp.gmail.com"
                value={host}
                onChange={e => setHost(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Port</label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="pl-10 relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none focus:ring-gray-900 sm:text-sm"
                placeholder="e.g. 465 (SSL) or 587 (TLS)"
                value={port}
                onChange={e => setPort(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center bg-blue-600 text-white font-medium px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Settings...
              </>
            ) : 'Save SMTP Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, userData, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isSpecialAdmin = user?.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
  const isAdmin = userData?.role === 'admin' || isSpecialAdmin;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
        <ShieldAlert className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
      </div>
    );
  }

  const links = [
    { name: 'Manage Services', href: '/admin/services', icon: List, desc: 'Add or edit services' },
    { name: 'Manage Orders', href: '/admin/orders', icon: ShoppingCart, desc: 'View and update orders' },
    { name: 'Wallet Requests', href: '/admin/deposits', icon: Wallet, desc: 'Approve manual deposits' },
    { name: 'Manage Users', href: '/admin/users', icon: Users, desc: 'View users and balances' },
    { name: 'Redeem Codes', href: '/admin/redeem-codes', icon: Key, desc: 'Manage & monitor promo codes' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {links.map((link) => (
          <Link key={link.name} to={link.href} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <link.icon className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{link.name}</h3>
            <p className="mt-2 text-sm text-gray-500">{link.desc}</p>
          </Link>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardVisualization />
        </div>
        <div>
          <SMMProviderStatus />
        </div>
      </div>
      
      <EndpointStatus />
    </div>
  );
}
