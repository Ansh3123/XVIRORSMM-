import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminUsers() {
  const { user, userData, loading: authLoading } = useAuth();
  const isSpecialAdmin = user?.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
  const isAdmin = userData?.role === 'admin' || isSpecialAdmin;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(loaded);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (userId: string, currentBalance: number) => {
    const newBalanceStr = window.prompt("Enter new balance:", String(currentBalance));
    if (newBalanceStr === null) return;
    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) return alert("Invalid amount");

    try {
      await updateDoc(doc(db, 'users', userId), { balance: newBalance });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update balance');
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-500 text-sm mt-1">View users and update balances manually.</p>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : users.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No users found.</li>
          ) : (
            users.map((u) => (
              <li key={u.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.email}</p>
                  <p className="text-sm text-gray-500">ID: {u.id}</p>
                  <p className="text-sm text-gray-500">Role: {u.role}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-lg font-bold text-gray-900">₹{(u.balance || 0).toFixed(2)}</p>
                  <button onClick={() => handleUpdateBalance(u.id, u.balance || 0)} className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors">
                    Edit Balance
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
