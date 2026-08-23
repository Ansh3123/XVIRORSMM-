import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Check, X, ImageIcon, XCircle } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  type: string;
  status: string;
  createdAt: number;
  proofImage?: string;
  rejectReason?: string;
}

export default function AdminDeposits() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
        if (!window.confirm(`Are you sure you want to approve ₹${amount} for this user?`)) return;
        
        try {
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
        } catch (txErr: any) {
          console.warn("Transaction failed, trying fallback sequential updates:", txErr);
          const userRef = doc(db, 'users', userId);
          const txRef = doc(db, 'transactions', txId);
          
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) throw new Error("User does not exist");
          
          const newBalance = (userDoc.data().balance || 0) + amount;
          
          await updateDoc(userRef, { balance: newBalance });
          await updateDoc(txRef, { status: newStatus });
        }
        
        setSuccessMessage('recharge request accept');
        setShowSuccessPopup(true);
      } else if (newStatus === 'rejected') {
        const reason = window.prompt("Enter reason for rejection (this will be shown to the user):");
        if (reason === null) return; // User cancelled
        
        await updateDoc(doc(db, 'transactions', txId), { 
          status: newStatus,
          rejectReason: reason || "Deposit request was declined."
        });
        
        setSuccessMessage('Recharge request rejected successfully');
        setShowSuccessPopup(true);
      } else {
        await updateDoc(doc(db, 'transactions', txId), { status: newStatus });
      }
      fetchTransactions();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update transaction: ${err.message || err}`);
    }
  };

  if (userData?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user deposit requests and review payment proofs.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : transactions.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No deposit requests found.</li>
          ) : (
            transactions.map((tx) => (
              <li key={tx.id} className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    User: <span className="text-blue-600">{tx.userEmail || "Registered User"}</span>
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {tx.userId}</p>
                  <p className="text-sm text-gray-500 mt-1">Amount: <span className="font-bold text-green-600">₹{tx.amount.toFixed(2)}</span></p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                  
                  {tx.status === 'rejected' && tx.rejectReason && (
                    <p className="text-xs text-red-500 mt-2 font-medium">Reason: {tx.rejectReason}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {tx.proofImage && (
                    <button 
                      onClick={() => setViewProof(tx.proofImage!)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ImageIcon className="w-4 h-4 mr-2 text-blue-500" /> View Proof
                    </button>
                  )}
                  
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    tx.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : tx.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.status === 'pending' 
                      ? 'Pending Verification' 
                      : tx.status === 'completed' 
                      ? 'Approved' 
                      : 'Rejected'}
                  </span>

                  {tx.status === 'pending' && (
                    <div className="flex space-x-2 ml-2">
                      <button onClick={() => handleUpdateStatus(tx.id, tx.userId, tx.amount, 'completed')} className="text-green-600 hover:text-white hover:bg-green-600 border border-green-600 bg-green-50 p-2 rounded-full transition-colors" title="Approve">
                        <Check className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleUpdateStatus(tx.id, tx.userId, tx.amount, 'rejected')} className="text-red-600 hover:text-white hover:bg-red-600 border border-red-600 bg-red-50 p-2 rounded-full transition-colors" title="Reject">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={() => setViewProof(null)}>
          <div className="relative max-w-3xl max-h-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewProof(null)}
              className="absolute -top-4 -right-4 p-1 bg-white rounded-full text-gray-600 hover:text-gray-900 shadow-lg"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img src={viewProof} alt="Payment Proof" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* Success Status Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 text-center animate-scale-in">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">{successMessage}</h3>
            <p className="text-sm text-gray-500 mb-6">The transaction request state has been updated successfully.</p>
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
