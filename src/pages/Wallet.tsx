import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc } from 'firebase/firestore';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Deposit state
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState('');

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

  useEffect(() => {
    fetchTransactions();
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
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userEmail: user.email || userData?.email || '',
        amount: parseFloat(amountToSave),
        type: 'deposit',
        status: 'pending',
        proofImage: proofImage,
        createdAt: Date.now()
      });
      setSubmittedAmount(amountToSave);
      setShowSuccess(true);
      setDepositAmount('');
      setProofImage(null);
      setStep(1);
      fetchTransactions();
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
                  We are reviewing your payment proof. Once approved by the administrator, the funds will be added to your wallet automatically.
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
                <p>Enter the amount you wish to deposit (Minimum ₹10)</p>
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
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
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Payment <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleDeposit} className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-md font-semibold text-gray-900">Pay ₹{depositAmount}</h3>
                 <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-500">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-3 text-center">
                 <p className="text-sm text-gray-700">Open a UPI app to complete payment to:</p>
                 <p className="font-bold text-lg text-blue-800">{upiId}</p>
                 
                 <div className="flex flex-wrap gap-2 justify-center mt-3">
                   <a href={getUpiUrl()} className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                     Open UPI App
                   </a>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Upload Payment Screenshot (Required)
                 </label>
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative">
                   <div className="space-y-1 text-center">
                     {proofImage ? (
                       <img src={proofImage} alt="Proof preview" className="mx-auto h-32 object-contain" />
                     ) : (
                       <Upload className="mx-auto h-12 w-12 text-gray-400" />
                     )}
                     <div className="flex text-sm text-gray-600 justify-center">
                       <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                         <span>{proofImage ? 'Change Image' : 'Upload a file'}</span>
                         <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} required={!proofImage} />
                       </label>
                     </div>
                     {!proofImage && <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>}
                   </div>
                 </div>
               </div>

              <button
                type="submit"
                disabled={submitting || !proofImage}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                    <p className={`text-xs capitalize font-medium ${tx.status === 'pending' ? 'text-yellow-600' : tx.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.status}
                    </p>
                    {tx.status === 'rejected' && tx.rejectReason && (
                       <p className="text-xs text-red-500 mt-1">Reason: {tx.rejectReason}</p>
                    )}
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
