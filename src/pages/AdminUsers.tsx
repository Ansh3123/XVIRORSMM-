import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminUsers() {
  const { user, userData, loading: authLoading } = useAuth();
  const isSpecialAdmin = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'].includes(user?.email?.toLowerCase().trim() || '');
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

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmChange = window.confirm(`Are you sure you want to change this user's role to "${newRole}" permanently?`);
    if (!confirmChange) return;

    try {
      await updateDoc(doc(db, 'users', userId), { 
        role: newRole,
        updatedAt: Date.now()
      });
      alert(`User's role successfully updated to "${newRole}".`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update user role');
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
        <p className="text-gray-500 text-sm mt-1">View users, update balances, and edit user roles permanently.</p>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : users.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No users found.</li>
          ) : (
            users.map((u) => (
              <li key={u.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{u.email}</p>
                  <p className="text-xs text-gray-500">ID: {u.id}</p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-400">Role:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                  <p className="text-lg font-bold text-gray-900">₹{(u.balance || 0).toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateBalance(u.id, u.balance || 0)} 
                      className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors font-medium cursor-pointer"
                    >
                      Edit Balance
                    </button>
                    <button 
                      onClick={() => handleUpdateRole(u.id, u.role || 'user')} 
                      className="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md hover:bg-purple-100 transition-colors font-medium cursor-pointer"
                    >
                      Change Role
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
