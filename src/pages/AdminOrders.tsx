import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminOrders() {
  const { user, userData, loading: authLoading } = useAuth();
  const isSpecialAdmin = user?.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
  const isAdmin = userData?.role === 'admin' || isSpecialAdmin;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) fetchOrders();
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(loaded);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: Date.now() });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-semibold">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        <p className="text-gray-500 text-sm mt-1">View and update user orders.</p>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : orders.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No orders found.</li>
          ) : (
            orders.map((order) => (
              <li key={order.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">User ID: {order.userId}</p>
                  <p className="text-sm text-gray-900">Service ID: {order.serviceId} - Link: {order.link}</p>
                  <p className="text-sm text-gray-500">Qty: {order.quantity} - Charge: ₹{order.charge?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col space-y-2 items-end">
                  <select 
                    value={order.status} 
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="mt-1 block w-full py-1 px-2 border-gray-300 bg-gray-50 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Partial">Partial</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
