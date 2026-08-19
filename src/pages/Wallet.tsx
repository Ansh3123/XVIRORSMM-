import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: number;
}

export default function Wallet() {
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const loadedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));
        
        loadedTransactions.sort((a, b) => b.createdAt - a.createdAt);
        setTransactions(loadedTransactions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !depositAmount) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: parseFloat(depositAmount),
        type: 'deposit',
        status: 'pending',
        createdAt: Date.now()
      });
      setDepositAmount('');
      // Trigger a re-fetch conceptually or rely on state. 
      // For simplicity, we just reload the page or add to local state.
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Balance</h2>
          <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
            ₹{userData?.balance?.toFixed(2) || '0.00'}
          </div>
          <p className="mt-1 text-sm text-gray-500">Total spent: ₹{userData?.totalSpent?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Funds via UPI</h2>
          <form onSubmit={handleDeposit} className="flex space-x-3">
            <div className="flex-1">
              <label htmlFor="amount" className="sr-only">Amount</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  min="10"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Deposit
            </button>
          </form>
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-1">Manual Payment Instructions:</p>
            <p className="text-xs text-blue-700">1. Send your desired deposit amount via UPI to: <strong className="font-bold text-gray-900 block mt-1 mb-2 text-base">isanshcool@fam</strong></p>
            <p className="text-xs text-blue-700">2. Enter the exact amount you paid in the box above and click Deposit.</p>
            <p className="text-xs text-blue-700">3. Admin will verify the transaction and add funds to your wallet shortly.</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction History</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : transactions.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No transactions yet.</li>
          ) : (
            transactions.map((tx) => (
              <li key={tx.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className={`h-5 w-5 ${tx.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`} /> : <ArrowUpRight className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-500">{format(tx.createdAt, 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </p>
                    <p className={`text-xs capitalize ${tx.status === 'pending' ? 'text-yellow-600' : tx.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.status}
                    </p>
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
