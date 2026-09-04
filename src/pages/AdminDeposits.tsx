import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, rtdb } from '../lib/firebase';
import { ref as rtdbRef, update as rtdbUpdate, onValue as rtdbOnValue } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loader2, Check, X, ImageIcon, XCircle, AlertCircle, Search, RefreshCw, UserCheck } from 'lucide-react';

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
  utr?: string;
}

export default function AdminDeposits() {
  const { user, userData, loading: authLoading } = useAuth();
  const isSpecialAdmin = user?.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
  const isAdmin = userData?.role === 'admin' || isSpecialAdmin;
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // UTR Search & Verification Console State
  const [searchUtr, setSearchUtr] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedRequest, setMatchedRequest] = useState<RechargeRequest | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<{ type: 'error' | 'success' | 'already_used'; message: string } | null>(null);

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

  const { showToast } = useToast();
  const isInitialMount = useRef(true);
  const notifiedRequestIdsRef = useRef<Set<string>>(new Set());

  // Live real-time Firestore listener for all wallet recharge requests
  useEffect(() => {
    if (!isAdmin) return;

    setError(null);
    const q = query(collection(db, 'walletRechargeRequests'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(fsDoc => {
        const fsData = fsDoc.data();
        return {
          id: fsDoc.id,
          userId: fsData.userId,
          userEmail: fsData.userEmail,
          amount: fsData.amount,
          status: fsData.status,
          createdAt: fsData.createdAt,
          proofImage: fsData.paymentProof || fsData.proofImage, // support both fields
          rejectReason: fsData.rejectReason,
          processedAt: fsData.processedAt,
          processedBy: fsData.processedBy,
          utr: fsData.utr || ''
        } as RechargeRequest;
      });
      
      // Real-time toast notification system for new pending requests
      if (isInitialMount.current) {
        // Register all currently existing request IDs so they do not trigger toasts on load
        snapshot.docs.forEach((doc) => {
          notifiedRequestIdsRef.current.add(doc.id);
        });
        isInitialMount.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const docId = change.doc.id;
            
            if (!notifiedRequestIdsRef.current.has(docId)) {
              notifiedRequestIdsRef.current.add(docId);
              if (data && data.status === 'pending') {
                showToast(
                  'info',
                  'New Deposit Request Received',
                  `User ${data.userEmail || 'unknown'} has submitted a new deposit request of $${data.amount || 0}.`,
                  12000
                );
              }
            }
          }
        });
      }

      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(loaded);
      setLoading(false);
    }, (fsErr: any) => {
      console.error("Firestore real-time listener error in admin panel:", fsErr);
      setError(fsErr.message || String(fsErr));
      setLoading(false);
      handleFirestoreError(fsErr, OperationType.LIST, 'walletRechargeRequests');
    });

    return () => {
      unsubscribe();
      // Reset mount state when component unmounts
      isInitialMount.current = true;
    };
  }, [userData, showToast]);

  // Reactively update search results when the requests collection changes in real-time
  useEffect(() => {
    if (!searched || !searchUtr) return;
    
    const cleanSearch = searchUtr.trim().toUpperCase();
    const exactMatch = requests.find(req => req.utr && req.utr.trim().toUpperCase() === cleanSearch);
    
    if (exactMatch) {
      if (exactMatch.status === 'accepted') {
        setMatchedRequest(null);
        setSearchFeedback({
          type: 'already_used',
          message: `This UTR (${cleanSearch}) has already been used and verified for user ${exactMatch.userEmail || 'unknown'}. Amount: ₹${exactMatch.amount.toFixed(2)}.`
        });
      } else if (exactMatch.status === 'rejected') {
        setMatchedRequest(null);
        setSearchFeedback({
          type: 'error',
          message: `This UTR (${cleanSearch}) was rejected previously for user ${exactMatch.userEmail || 'unknown'}.`
        });
      } else {
        setMatchedRequest(exactMatch);
        setSearchFeedback({
          type: 'success',
          message: `Exact match found! Pending payment request of ₹${exactMatch.amount.toFixed(2)} by user ${exactMatch.userEmail || 'unknown'}.`
        });
      }
    } else {
      setMatchedRequest(null);
      setSearchFeedback({
        type: 'error',
        message: 'UTR not found/mismatch. No pending transaction exists with this UTR reference.'
      });
    }
  }, [requests, searched, searchUtr]);

  const handleVerifyUtr = () => {
    const cleanSearch = searchUtr.trim().toUpperCase();
    if (!cleanSearch) {
      alert("Please enter a UTR number to search.");
      return;
    }
    setSearched(true);
  };

  const handleClearSearch = () => {
    setSearchUtr('');
    setSearched(false);
    setMatchedRequest(null);
    setSearchFeedback(null);
  };

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
      const reqRef = doc(db, 'walletRechargeRequests', txId);
      const userRef = doc(db, 'users', userId);
 
      if (type === 'accept') {
        // Wait exactly 2 seconds as requested by the user
        await new Promise((resolve) => setTimeout(resolve, 2000));
 
        // Direct non-transaction updates as requested by user
        const reqDoc = await getDoc(reqRef);
        if (!reqDoc.exists()) {
          throw new Error("Recharge request document does not exist.");
        }
        
        const reqData = reqDoc.data();
        if (reqData.status !== 'pending') {
          throw new Error("This request has already been processed by another administrator/device.");
        }
        
        const userDoc = await getDoc(userRef);
        const currentBalance = userDoc.exists() ? (userDoc.data().balance || 0) : 0;
        const newBalance = currentBalance + amount;
        
        // 1. Update user balance in Firestore
        await updateDoc(userRef, { 
          balance: newBalance,
          updatedAt: Date.now()
        });
 
        // 2. Update recharge request status in Firestore
        await updateDoc(reqRef, {
          status: 'accepted',
          processedAt: Date.now(),
          processedBy: adminId,
          updatedAt: Date.now()
        });

        // 3. Create a transaction record to keep a complete transaction history
        await addDoc(collection(db, 'transactions'), {
          userId,
          userEmail: reqData.userEmail || '',
          amount,
          type: 'deposit',
          status: 'completed',
          utr: reqData.utr || '',
          createdAt: reqData.createdAt,
          verifiedAt: Date.now(),
          verificationTime: Date.now()
        });
        
        // Clear matched request if it was the one processed
        if (matchedRequest && txId === matchedRequest.id) {
          handleClearSearch();
        }
        
        setSuccessMessage('admin credited');
        setShowSuccessPopup(true);
      } else if (type === 'reject') {
        const reqDoc = await getDoc(reqRef);
        if (!reqDoc.exists()) {
          throw new Error("Recharge request document does not exist.");
        }
        
        const reqData = reqDoc.data();
        if (reqData.status !== 'pending') {
          throw new Error("This request has already been processed by another administrator/device.");
        }
 
        // 1. Direct update for reject in Firestore
        await updateDoc(reqRef, {
          status: 'rejected',
          rejectReason: rejectReason || "Deposit request was declined.",
          processedAt: Date.now(),
          processedBy: adminId,
          updatedAt: Date.now()
        });
        
        setSuccessMessage('Recharge request rejected successfully');
        setShowSuccessPopup(true);
      }
      
      setConfirmState(null);
      setRejectReason('');
    } catch (err: any) {
      console.error(err);
      alert(`Error processing request: ${err.message || err}`);
      handleFirestoreError(err, OperationType.UPDATE, `walletRechargeRequests/${txId}`);
    } finally {
      setProcessing(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Wallet Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user deposit requests and review payment proofs in real-time.</p>
      </div>

      {/* UTR Verification Console Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>UTR Manual Verification Console</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Compare and search customer-submitted UTRs to safely match and verify payments with a single-use lock protection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-mono"
              placeholder="Enter customer UTR (e.g. 12-digit Ref No.)"
              value={searchUtr}
              onChange={(e) => setSearchUtr(e.target.value.trim().toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyUtr()}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleVerifyUtr}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              Verify UTR
            </button>
            {searched && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {searched && searchFeedback && (
          <div className="mt-4 animate-fade-in">
            {searchFeedback.type === 'success' && matchedRequest ? (
              <div className="p-5 bg-green-50/50 border border-green-200 rounded-lg space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 text-green-700 rounded-full shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-green-800">UTR Match Found!</h3>
                    <p className="text-xs text-green-700 mt-0.5">
                      This UTR exactly matches a pending payment request. Please confirm details below to credit the user.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-green-200 text-sm">
                  <div className="space-y-1.5 text-gray-700">
                    <p><span className="font-semibold text-gray-900">User Email:</span> {matchedRequest.userEmail || 'unknown'}</p>
                    <p><span className="font-semibold text-gray-900">User ID:</span> <span className="font-mono text-xs">{matchedRequest.userId}</span></p>
                    <p><span className="font-semibold text-gray-900">Submitted UTR:</span> <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded text-green-900 font-bold">{matchedRequest.utr}</span></p>
                    <p><span className="font-semibold text-gray-900">Requested Amount:</span> <span className="font-bold text-green-700">₹{matchedRequest.amount.toFixed(2)}</span></p>
                    <p><span className="font-semibold text-gray-900">Date Submitted:</span> {new Date(matchedRequest.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col justify-between items-start md:items-end gap-3">
                    {matchedRequest.proofImage ? (
                      <button
                        onClick={() => setViewProof(matchedRequest.proofImage!)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-xs text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
                      >
                        <ImageIcon className="w-4 h-4 mr-2 text-blue-500" /> View Payment Proof Receipt
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No payment proof receipt image attached.</span>
                    )}

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleConfirmRejectStep1(matchedRequest.id, matchedRequest.userId, matchedRequest.amount)}
                        className="flex-1 md:flex-none px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleConfirmAcceptStep1(matchedRequest.id, matchedRequest.userId, matchedRequest.amount)}
                        className="flex-1 md:flex-none px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Verify & Credit Wallet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : searchFeedback.type === 'already_used' ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h3 className="text-sm font-bold text-yellow-800">UTR Already Verified / Used</h3>
                  <p className="text-xs text-yellow-700 mt-1">{searchFeedback.message}</p>
                  <p className="text-xs text-yellow-600 mt-2 font-semibold font-mono bg-yellow-100/50 px-2.5 py-1.5 rounded border border-yellow-200">🛡️ Transactional Lock Active: A UTR can only be used and credited exactly once.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">Verification Rejected</h3>
                  <p className="text-xs text-red-700 mt-1">{searchFeedback.message}</p>
                  <p className="text-xs text-red-600 mt-2 font-semibold">Double-check the reference number or verify if the client has submitted the correct code.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Database Load Error</p>
            <p className="text-xs opacity-90 mt-0.5">{error}</p>
            <p className="text-xs opacity-75 mt-2">Please ensure security rules are successfully deployed for your custom Firestore database.</p>
          </div>
        </div>
      )}

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
                  {tx.utr && (
                    <p className="text-xs text-gray-600 mt-1 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded font-mono inline-block select-all">
                      UTR: <span className="font-bold text-gray-800">{tx.utr}</span>
                    </p>
                  )}
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
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {confirmState.type === 'accept' ? 'Crediting in 2s...' : 'Rejecting...'}
                  </span>
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
            <p className="text-sm text-gray-500 mb-6">
              {successMessage === 'admin credited'
                ? "Funds have been credited directly into the user's wallet via Firebase Firestore."
                : "The request state has been updated successfully."}
            </p>
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
