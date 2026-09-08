import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Search, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  serviceId: string;
  serviceName?: string;
  providerOrderId?: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  startCount?: string;
  remains?: number;
  refundProcessed?: boolean;
  createdAt: number;
}

export default function Orders() {
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const ordersRef = collection(db, 'orders');
      const q = isAdmin 
        ? query(ordersRef) 
        : query(ordersRef, where('userId', '==', user.uid));
        
      const querySnapshot = await getDocs(q);
      const loadedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      
      // Manual sort since composite index might be missing
      loadedOrders.sort((a, b) => b.createdAt - a.createdAt);
      
      setOrders(loadedOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, isAdmin]);

  const handleSyncStatuses = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/smm/sync-orders', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Synced ${data.checkedCount || 0} active orders (${data.updatedCount || 0} updated)`);
        await fetchOrders();
      } else {
        setSyncMsg(data.error || 'Failed to sync statuses');
      }
    } catch (err: any) {
      setSyncMsg(err.message || 'Status sync request failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (s === 'in progress' || s === 'processing') return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (s === 'pending' || s === 'accepted') return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    if (s === 'partial') return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (s === 'canceled' || s === 'cancelled' || s === 'refunded' || s === 'failed') return 'bg-red-100 text-red-800 border border-red-200';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return order.id.toLowerCase().includes(searchLower) ||
           (order.providerOrderId && order.providerOrderId.toLowerCase().includes(searchLower)) ||
           (order.serviceName && order.serviceName.toLowerCase().includes(searchLower)) ||
           order.serviceId.toLowerCase().includes(searchLower) ||
           order.link.toLowerCase().includes(searchLower);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="mt-1 text-sm text-gray-500">Live order progress tracked continuously with the SMM provider.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            onClick={handleSyncStatuses}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{syncing ? 'Checking Statuses...' : 'Sync Order Statuses'}</span>
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span>{syncMsg}</span>
        </div>
      )}

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search orders (ID, Link, Service)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Order</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Link</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Charge</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                        No orders matched your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div>#{order.id.slice(0, 8).toUpperCase()}</div>
                          {order.providerOrderId && (
                            <div className="text-[11px] text-gray-400 font-mono">
                              Provider #{order.providerOrderId}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(order.createdAt, 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={order.serviceName || order.serviceId}>
                          <div className="truncate font-medium">{order.serviceName || `Service ID: ${order.serviceId}`}</div>
                          <div className="text-xs text-gray-400">ID #{order.serviceId}</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">{order.link}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">₹{order.charge?.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.quantity?.toLocaleString()}
                          {order.remains !== undefined && order.remains !== null && (
                            <span className="block text-[11px] text-amber-600 font-medium">Remains: {order.remains}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.refundProcessed && (
                            <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Refunded</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
