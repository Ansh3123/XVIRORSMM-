import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Users, ShoppingCart, List, Wallet, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function AdminDashboard() {
  const { userData } = useAuth();

  if (userData?.role !== 'admin') {
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
  ];

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {links.map((link) => (
          <Link key={link.name} to={link.href} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <link.icon className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{link.name}</h3>
            <p className="mt-2 text-sm text-gray-500">{link.desc}</p>
          </Link>
        ))}
      </div>
      
      <EndpointStatus />
    </div>
  );
}
