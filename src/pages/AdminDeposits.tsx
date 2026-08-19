import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Check, X } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: number;
}

export default function AdminDeposits() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(loaded);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (txId: string, userId: string, amount: number, newStatus: string) => {
    try {
      if (newStatus === 'completed') {
        // Run as transaction to safely update user balance
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', userId);
          const txRef = doc(db, 'transactions', txId);
          
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("User does not exist");
          
          const newBalance = (userDoc.data().balance || 0) + amount;
          
          transaction.update(userRef, { balance: newBalance });
          transaction.update(txRef, { status: newStatus });
        });
      } else {
        await updateDoc(doc(db, 'transactions', txId), { status: newStatus });
      }
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert('Failed to update transaction');
    }
  };

  if (userData?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user deposit requests.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : transactions.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No deposit requests found.</li>
          ) : (
            transactions.map((tx) => (
              <li key={tx.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">User ID: {tx.userId}</p>
                  <p className="text-sm text-gray-500">Amount: ₹{tx.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {tx.status}
                  </span>
                  {tx.status === 'pending' && (
                    <>
                      <button onClick={() => handleUpdateStatus(tx.id, tx.userId, tx.amount, 'completed')} className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full">
                        <Check className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleUpdateStatus(tx.id, tx.userId, tx.amount, 'failed')} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full">
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
