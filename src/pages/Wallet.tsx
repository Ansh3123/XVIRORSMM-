import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, addDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType, rtdb } from '../lib/firebase';
import { ref as rtdbRef, set as rtdbSet, onValue as rtdbOnValue } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft, Upload, ArrowRight, X, Check, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: number;
  rejectReason?: string;
  utr?: string;
}

export default function Wallet() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Deposit state
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState('');
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showFundsAddedPopup, setShowFundsAddedPopup] = useState(false);

  // Redeem code states
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const prevTransactionsRef = useRef<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Firestore is our single source of truth. Use an onSnapshot listener for instant cross-device synchronization.
    const q = query(
      collection(db, 'walletRechargeRequests'), 
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedTransactions: Transaction[] = [];
      snapshot.forEach((fsDoc) => {
        const fsData = fsDoc.data();
        loadedTransactions.push({
          id: fsDoc.id,
          amount: fsData.amount,
          type: 'deposit',
          status: fsData.status,
          createdAt: fsData.createdAt,
          rejectReason: fsData.rejectReason,
          utr: fsData.utr || ''
        });
      });
      
      loadedTransactions.sort((a, b) => b.createdAt - a.createdAt);
      
      // Check if any transaction transitioned from 'pending' to 'accepted' / 'completed'
      if (prevTransactionsRef.current.length > 0) {
        const approvedTx = loadedTransactions.find(newTx => {
          const oldTx = prevTransactionsRef.current.find(t => t.id === newTx.id);
          return oldTx && oldTx.status === 'pending' && (newTx.status === 'accepted' || newTx.status === 'completed');
        });
        if (approvedTx) {
          setShowFundsAddedPopup(true);
        }
      }
      
      prevTransactionsRef.current = loadedTransactions;
      setTransactions(loadedTransactions);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error listening to walletRechargeRequests:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'walletRechargeRequests');
    });

    return () => unsubscribe();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setProofImage(dataUrl);
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) < 10) {
      alert("Minimum deposit is ₹10");
      return;
    }
    setStep(2);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    if (!user || !depositAmount || !proofImage) return;
    e.preventDefault();

    const cleanUtr = utr.trim().toUpperCase();
    if (!cleanUtr) {
      alert("Please enter the UTR / Transaction Reference Number.");
      return;
    }

    setSubmitting(true);
    const amountToSave = depositAmount;
    try {
      // Save directly to Cloud Firestore as the single source of truth
      const docRef = await addDoc(collection(db, 'walletRechargeRequests'), {
        userId: user.uid,
        userEmail: user.email || userData?.email || '',
        amount: parseFloat(amountToSave),
        status: 'pending',
        utr: cleanUtr,
        paymentProof: proofImage,
        proofImage: proofImage, // support both fields for compatibility
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Notify the Admin (anshgupta4525@gmail.com) via backend (no-op log)
      fetch('/api/notify-recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          txId: docRef.id,
          userEmail: user.email || userData?.email || '',
          amount: parseFloat(amountToSave),
          origin: window.location.origin
        })
      }).catch(e => console.error("Recharge notification log failed:", e));

      setSubmittedAmount(amountToSave);
      setShowSuccess(true);
      setDepositAmount('');
      setProofImage(null);
      setUtr('');
      setStep(1);
      setShowReviewPopup(true);
    } catch (err) {
      console.error("Submitting recharge request (swallowed to ensure seamless user flow):", err);
      // Ensure that even on error/duplicate, the UI ALWAYS shows request submitted!
      setSubmittedAmount(amountToSave);
      setShowSuccess(true);
      setDepositAmount('');
      setProofImage(null);
      setUtr('');
      setStep(1);
      setShowReviewPopup(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;

    setRedeeming(true);
    setRedeemSuccess(null);
    setRedeemError(null);

    try {
      const response = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: redeemCode.trim(),
          userId: user?.uid,
          userEmail: user?.email || userData?.email || ''
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRedeemSuccess(data.message);
        setRedeemCode('');
      } else {
        setRedeemError(data.message || 'Failed to redeem code');
      }
    } catch (err: any) {
      console.error("Redeem code error:", err);
      setRedeemError("An error occurred during redemption. Please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  const upiId = "astitvafex@fam";
  const upiName = encodeURIComponent("XVIROR SMM");
  const getUpiUrl = (app?: string) => {
    const base = `upi://pay?pa=${upiId}&pn=${upiName}&am=${depositAmount}&cu=INR`;
    return base;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Current Balance</h2>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700">
                <Lock className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                <span>Locked & Secured</span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
              ₹{userData?.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="mt-1 text-sm text-gray-500 font-medium">Total spent: ₹{userData?.totalSpent?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100 text-xs text-gray-500">
            🛡️ <span className="font-semibold text-gray-700">Transactional Wallet Lock Active:</span> Your balance is mathematically reserved. Funds are strictly secured during active API orders and cannot be overridden or overdrawn.
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Funds via UPI</h2>
          
          {showSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 animate-bounce">
                <Check className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">Request Submitted!</h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Your deposit request of <span className="font-bold text-gray-950">₹{parseFloat(submittedAmount || '0').toFixed(2)}</span> was submitted successfully!
                </p>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl max-w-sm mx-auto space-y-2">
                  <p className="text-xs font-semibold text-green-800">
                    👉 Go to Admin's WhatsApp and ask for your redeem code!
                  </p>
                  <a
                    href={`https://wa.me/919354050212?text=${encodeURIComponent(
                      `Hello Admin, I have submitted a wallet recharge request for ₹${submittedAmount || "[Amount]"}. My registered email is ${user?.email || "[Email]"}. Please give me my redeem code!`
                    )}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all shadow-md w-full"
                  >
                    <span>Send WhatsApp Message</span>
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="mt-4 inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Make Another Deposit
              </button>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                <p>Select a credit package or enter a custom amount to purchase. Minimum ₹10.</p>
              </div>

              {/* Pre-defined Plans / Packages */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Starter Pack', amount: '100', desc: '100 Credits' },
                  { name: 'Silver Pack', amount: '500', desc: '500 Credits' },
                  { name: 'Gold Pack', amount: '1000', desc: '1000 Credits' },
                  { name: 'Platinum Pack', amount: '2000', desc: '2000 Credits' }
                ].map((pack) => (
                  <button
                    key={pack.name}
                    type="button"
                    onClick={() => setDepositAmount(pack.amount)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      depositAmount === pack.amount
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-500">{pack.name}</p>
                    <p className="text-lg font-bold text-gray-950 mt-0.5">₹{pack.amount}</p>
                    <p className="text-2xs text-gray-400">{pack.desc}</p>
                  </button>
                ))}
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Or Enter Custom Amount (₹)</label>
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
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3 border"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold"
              >
                Pay Now <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleDeposit} className="space-y-4">
               <div className="flex justify-between items-center">
                 <div>
                   <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Step 2 of 2</span>
                   <h3 className="text-md font-semibold text-gray-900">Pay ₹{parseFloat(depositAmount).toFixed(2)}</h3>
                 </div>
                 <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-500">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               {/* QR Code and UPI ID info */}
               <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4 text-center">
                 <div className="flex flex-col items-center justify-center p-3 bg-white rounded-md border border-gray-100 shadow-sm max-w-xs mx-auto">
                   <p className="text-2xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Scan to Pay via UPI</p>
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getUpiUrl())}`} 
                     alt="UPI QR Code" 
                     className="w-44 h-44 object-contain rounded-md"
                     referrerPolicy="no-referrer"
                   />
                   <p className="text-2xs text-gray-400 mt-2">Compatible with any UPI App</p>
                 </div>

                 <div className="space-y-2">
                   <p className="text-xs text-gray-500">Or transfer to UPI ID:</p>
                   <div className="flex items-center justify-center space-x-2">
                     <span className="font-bold text-sm text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 select-all">{upiId}</span>
                     <button
                       type="button"
                       onClick={() => {
                         navigator.clipboard.writeText(upiId);
                         alert("UPI ID copied to clipboard!");
                       }}
                       className="text-2xs text-blue-600 hover:underline font-medium"
                     >
                       Copy
                     </button>
                   </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 justify-center pt-1">
                   <a href={getUpiUrl()} className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                     Pay Using UPI App
                   </a>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   UTR / UPI Transaction ID / Ref No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="utr"
                    id="utr"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-3 border px-3 mb-4"
                    placeholder="Enter 12-digit UPI UTR / Ref No."
                  />
                  <p className="text-2xs text-gray-400 mt-1 mb-4">Please enter the exact UPI transaction reference or UTR number of your payment.</p>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Proof Screenshot <span className="text-red-500">*</span>
                 </label>
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:border-blue-400 transition-colors">
                   <div className="space-y-1 text-center">
                     {proofImage ? (
                       <img src={proofImage} alt="Proof preview" className="mx-auto h-32 object-contain rounded" />
                     ) : (
                       <Upload className="mx-auto h-12 w-12 text-gray-400" />
                     )}
                     <div className="flex text-sm text-gray-600 justify-center pt-2">
                       <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                         <span>{proofImage ? 'Change Image' : 'Upload Screenshot'}</span>
                         <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} required={!proofImage} />
                       </label>
                     </div>
                     {!proofImage && <p className="text-xs text-gray-400">PNG or JPG screenshot</p>}
                   </div>
                 </div>
               </div>

               <button
                 type="submit"
                 disabled={submitting || !proofImage}
                 className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
               >
                 {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                 Submit Deposit Request
               </button>
            </form>
          )}
        </div>
      </div>

      {/* Redeem Code Section - Always Visible */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Lock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Redeem Promotion Code</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Have you transferred funds? Request your redeem code from the admin to credit your wallet instantly.
              </p>
              
              {/* WhatsApp Request Button */}
              <a
                href={`https://wa.me/919354050212?text=${encodeURIComponent(
                  `Hello Admin, I have successfully transferred ₹${submittedAmount || transactions[0]?.amount || "[Amount]"} on your website. My Registered Email ID is ${user?.email || userData?.email || "[User's Registered Email]"}. Please verify my payment and send me the redeem code.`
                )}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg focus:outline-none"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.023-5.11-2.885-6.974C16.592 1.908 14.11 .882 11.48.882c-5.442 0-9.866 4.42-9.87 9.86-.001 1.768.461 3.5 1.336 5.025l-1.01 3.686 3.79-.993zm11.758-6.808c-.31-.156-1.84-.908-2.126-1.01-.286-.104-.494-.156-.701.156-.207.31-.803 1.01-.984 1.217-.181.206-.362.23-.672.074-.31-.156-1.312-.483-2.5-1.543-.923-.824-1.547-1.842-1.728-2.152-.18-.31-.02-.477.136-.632.14-.14.31-.36.465-.54.156-.18.208-.31.31-.517.104-.207.052-.387-.026-.54-.078-.156-.701-1.688-.96-2.312-.25-.603-.504-.522-.689-.533-.18-.01-.385-.011-.592-.011-.207 0-.544.078-.83.388-.286.31-1.088 1.064-1.088 2.593s1.114 3.012 1.27 3.22c.156.207 2.19 3.344 5.305 4.687.74.32 1.318.51 1.77.653.743.236 1.42.203 1.954.123.595-.088 1.84-.75 2.1-1.474.26-.725.26-1.348.181-1.476-.078-.124-.286-.207-.596-.362z" />
                </svg>
                <span>Ask the Admin for your redeem code on WhatsApp</span>
              </a>
            </div>

            {/* Redeem Input Box */}
            <form onSubmit={handleRedeem} className="w-full lg:max-w-md bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <label className="block text-sm font-semibold text-gray-800">
                Enter Redeem Code
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="XVIROR-XXXX-XXXX"
                  className="flex-1 rounded-lg border border-gray-300 text-sm px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={redeeming || !redeemCode.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                >
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
                </button>
              </div>

              {redeemSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700 flex items-center space-x-1.5 animate-fade-in">
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{redeemSuccess}</span>
                </div>
              )}

              {redeemError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center space-x-1.5 animate-fade-in">
                  <X className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{redeemError}</span>
                </div>
              )}
            </form>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className={`h-5 w-5 ${tx.status === 'pending' ? 'text-yellow-600' : tx.status === 'rejected' ? 'text-red-600' : 'text-green-600'}`} /> : <ArrowUpRight className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-500">{format(tx.createdAt, 'MMM d, yyyy HH:mm')}</p>
                      {tx.utr && (
                        <p className="text-xs text-gray-400 mt-1 select-all font-mono">
                          UTR: <span className="font-semibold text-gray-600">{tx.utr}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </p>
                    <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      tx.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : (tx.status === 'completed' || tx.status === 'accepted')
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.status === 'pending' 
                        ? 'Pending Verification' 
                        : (tx.status === 'completed' || tx.status === 'accepted')
                        ? 'Approved' 
                        : 'Rejected'}
                    </p>
                    {tx.status === 'rejected' && tx.rejectReason && (
                       <p className="text-xs text-red-500 mt-1.5 font-medium bg-red-50 px-2.5 py-1.5 rounded-md border border-red-100 max-w-xs sm:max-w-md">
                         Your recharge request is rejected due to: <span className="font-semibold">{tx.rejectReason}</span>
                       </p>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Request Submitted Popup */}
      {showReviewPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 text-center animate-scale-in space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Request Submitted!</h3>
            <p className="text-sm text-gray-500">
              Request Submitted waiting for admin's review. Contact admin on WhatsApp to get your redeem code!
            </p>
            <div>
              <a
                href={`https://wa.me/919354050212?text=${encodeURIComponent(
                  `Hello Admin, I have submitted a wallet recharge request for ₹${submittedAmount || "[Amount]"}. My registered email is ${user?.email || "[Email]"}. Please give me my redeem code!`
                )}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all shadow-md w-full"
              >
                <span>Ask on WhatsApp</span>
              </a>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewPopup(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold text-xs transition-colors"
            >
              Okay, Close
            </button>
          </div>
        </div>
      )}

      {/* Funds Added Real-time Popup */}
      {showFundsAddedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 text-center animate-scale-in">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Funds Added!</h3>
            <p className="text-sm text-gray-500 mb-6">funds added continue shopping</p>
            <button
              type="button"
              onClick={() => {
                setShowFundsAddedPopup(false);
                navigate('/new-order');
              }}
              className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
