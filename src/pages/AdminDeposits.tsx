import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Check, X, ImageIcon, XCircle } from 'lucide-react';

interface RechargeRequest {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  proofImage?: string;
  rejectReason?: string;
  processedAt?: number;
  processedBy?: string;
}

export default function AdminDeposits() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Confirmation flow state
  const [confirmState, setConfirmState] = useState<{
    type: 'accept' | 'reject';
    txId: string;
    userId: string;
    amount: number;
    step: 1 | 2;
  } | null>(null);

  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Live real-time Firestore listener
  useEffect(() => {
    if (userData?.role !== 'admin') return;

    const q = query(collection(db, 'rechargeRequests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RechargeRequest));
      
      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(loaded);
      setLoading(false);
    }, (err) => {
      console.error("Firestore real-time listener error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleConfirmAcceptStep1 = (txId: string, userId: string, amount: number) => {
    setConfirmState({
      type: 'accept',
      txId,
      userId,
      amount,
      step: 1
    });
  };

  const handleConfirmRejectStep1 = (txId: string, userId: string, amount: number) => {
    setConfirmState({
      type: 'reject',
      txId,
      userId,
      amount,
      step: 1
    });
  };

  const handleExecuteAction = async () => {
    if (!confirmState || !userData) return;
    setProcessing(true);
    
    const { type, txId, userId, amount } = confirmState;
    const adminId = userData.uid || 'admin';
    
    try {
      if (type === 'accept') {
        // Run as Firestore Transaction for absolute Duplicate Protection
        await runTransaction(db, async (transaction) => {
          const reqRef = doc(db, 'rechargeRequests', txId);
          const reqDoc = await transaction.get(reqRef);
          if (!reqDoc.exists()) {
            throw new Error("Recharge request document does not exist.");
          }
          
          const reqData = reqDoc.data();
          if (reqData.status !== 'pending') {
            throw new Error("This request has already been processed by another administrator/device.");
          }
          
          const userRef = doc(db, 'users', userId);
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error("User profile not found.");
          }
          
          const currentBalance = userDoc.data().balance || 0;
          const newBalance = currentBalance + amount;
          
          transaction.update(userRef, { balance: newBalance });
          transaction.update(reqRef, {
            status: 'accepted',
            processedAt: Date.now(),
            processedBy: adminId
          });
        });
        
        setSuccessMessage('recharge request accept');
        setShowSuccessPopup(true);
      } else if (type === 'reject') {
        // Run as Firestore Transaction for rejecting safely
        await runTransaction(db, async (transaction) => {
          const reqRef = doc(db, 'rechargeRequests', txId);
          const reqDoc = await transaction.get(reqRef);
          if (!reqDoc.exists()) {
            throw new Error("Recharge request document does not exist.");
          }
          
          const reqData = reqDoc.data();
          if (reqData.status !== 'pending') {
            throw new Error("This request has already been processed by another administrator/device.");
          }
          
          transaction.update(reqRef, {
            status: 'rejected',
            rejectReason: rejectReason || "Deposit request was declined.",
            processedAt: Date.now(),
            processedBy: adminId
          });
        });
        
        setSuccessMessage('Recharge request rejected successfully');
        setShowSuccessPopup(true);
      }
      
      setConfirmState(null);
      setRejectReason('');
    } catch (err: any) {
      console.error(err);
      alert(`Error processing request: ${err.message || err}`);
    } finally {
      setProcessing(false);
    }
  };

  if (userData?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user deposit requests and review payment proofs in real-time.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : requests.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No deposit requests found.</li>
          ) : (
            requests.map((tx) => (
              <li key={tx.id} className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    User: <span className="text-blue-600">{tx.userEmail || "Registered User"}</span>
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {tx.userId}</p>
                  <p className="text-sm text-gray-500 mt-1">Amount: <span className="font-bold text-green-600">₹{tx.amount.toFixed(2)}</span></p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                  
                  {tx.status === 'rejected' && tx.rejectReason && (
                    <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 px-2 py-1 rounded border border-red-100 inline-block">
                      Reason: {tx.rejectReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {tx.proofImage && (
                    <button 
                      onClick={() => setViewProof(tx.proofImage!)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <ImageIcon className="w-4 h-4 mr-2 text-blue-500" /> View Proof
                    </button>
                  )}
                  
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    tx.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : tx.status === 'accepted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.status === 'pending' 
                      ? 'Pending' 
                      : tx.status === 'accepted' 
                      ? 'Accepted' 
                      : 'Rejected'}
                  </span>

                  {tx.status === 'pending' && (
                    <div className="flex space-x-2 ml-2">
                      <button 
                        onClick={() => handleConfirmAcceptStep1(tx.id, tx.userId, tx.amount)} 
                        className="text-green-600 hover:text-white hover:bg-green-600 border border-green-600 bg-green-50 p-2 rounded-full transition-all duration-200" 
                        title="Approve"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleConfirmRejectStep1(tx.id, tx.userId, tx.amount)} 
                        className="text-red-600 hover:text-white hover:bg-red-600 border border-red-600 bg-red-50 p-2 rounded-full transition-all duration-200" 
                        title="Reject"
                      >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" onClick={() => setViewProof(null)}>
          <div className="relative max-w-3xl max-h-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewProof(null)}
              className="absolute -top-4 -right-4 p-1 bg-white rounded-full text-gray-600 hover:text-gray-900 shadow-lg"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img src={viewProof} alt="Payment Proof" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border-4 border-white" />
          </div>
        </div>
      )}

      {/* Confirmation Dialog 1 */}
      {confirmState && confirmState.step === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 text-center animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmState.type === 'accept' ? 'Accept Recharge Request' : 'Reject Recharge Request'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {confirmState.type === 'accept' 
                ? 'Are you sure you want to accept this recharge request?' 
                : 'Are you sure you want to reject this recharge request?'}
            </p>
            
            {confirmState.type === 'reject' && (
              <div className="mb-6 text-left">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rejection Reason</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Invalid transaction ID"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setConfirmState(null); setRejectReason(''); }}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(prev => prev ? { ...prev, step: 2 } : null)}
                className={`flex-1 py-2.5 px-4 text-white rounded-lg font-semibold text-sm transition-colors ${
                  confirmState.type === 'accept' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog 2 */}
      {confirmState && confirmState.step === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 text-center animate-scale-in">
            <h3 className="text-lg font-bold text-red-600 mb-2">Final Confirmation</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              {confirmState.type === 'accept' 
                ? `Final confirmation: Accept ₹${confirmState.amount.toFixed(2)} and add it to the user's wallet?` 
                : 'Final confirmation: Reject this recharge request?'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setConfirmState(null); setRejectReason(''); }}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAction()}
                className={`flex-1 py-2.5 px-4 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center ${
                  confirmState.type === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : confirmState.type === 'accept' ? (
                  'Confirm Accept'
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
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
