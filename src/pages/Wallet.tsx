import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, addDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft, Upload, ArrowRight, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: number;
  rejectReason?: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState('');
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showFundsAddedPopup, setShowFundsAddedPopup] = useState(false);

  const prevTransactionsRef = useRef<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'rechargeRequests'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          type: 'deposit',
          status: data.status,
          createdAt: data.createdAt,
          rejectReason: data.rejectReason
        } as Transaction;
      });
      
      loadedTransactions.sort((a, b) => b.createdAt - a.createdAt);
      
      // Check if any transaction transitioned from 'pending' to 'completed' / 'accepted' (Approved)
      if (prevTransactionsRef.current.length > 0) {
        const approvedTx = loadedTransactions.find(newTx => {
          const oldTx = prevTransactionsRef.current.find(t => t.id === newTx.id);
          return oldTx && oldTx.status === 'pending' && (newTx.status === 'completed' || newTx.status === 'accepted');
        });
        if (approvedTx) {
          setShowFundsAddedPopup(true);
        }
      }
      
      prevTransactionsRef.current = loadedTransactions;
      setTransactions(loadedTransactions);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
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
    e.preventDefault();
    if (!user || !depositAmount || !proofImage) return;
    
    setSubmitting(true);
    const amountToSave = depositAmount;
    try {
      await addDoc(collection(db, 'rechargeRequests'), {
        userId: user.uid,
        userEmail: user.email || userData?.email || '',
        amount: parseFloat(amountToSave),
        status: 'pending',
        proofImage: proofImage,
        createdAt: Date.now()
      });
      setSubmittedAmount(amountToSave);
      setShowSuccess(true);
      setDepositAmount('');
      setProofImage(null);
      setStep(1);
      setShowReviewPopup(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const upiId = "astitvafex@fam";
  const upiName = encodeURIComponent("XVIROR SMM");
  const getUpiUrl = (app?: string) => {
    const base = `upi://pay?pa=${upiId}&pn=${upiName}&am=${depositAmount}&cu=INR`;
    return base;
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
          
          {showSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600">
                <Check className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Submitted for review</h3>
                <p className="text-sm text-gray-500">
                  Your deposit request of <span className="font-semibold text-gray-950">₹{parseFloat(submittedAmount || '0').toFixed(2)}</span> was submitted successfully!
                </p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Your payment status is now <span className="font-semibold text-yellow-600">Pending Verification</span>. Once verified by the admin, the credits will be activated immediately.
                </p>
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
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 text-center animate-scale-in">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Request Submitted</h3>
            <p className="text-sm text-gray-500 mb-6">Request Submitted waiting for admin's review</p>
            <button
              type="button"
              onClick={() => setShowReviewPopup(false)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              Okay
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
