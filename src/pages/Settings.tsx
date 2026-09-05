import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { encryptText } from '../lib/crypto';
import { Loader2, Key, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface PasswordRequestDoc {
  id: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: number;
}

export default function Settings() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [requests, setRequests] = useState<PasswordRequestDoc[]>([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  const fetchUserRequests = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'passwordRequests'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PasswordRequestDoc));
      // Sort manually
      docs.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(docs);
    } catch (err) {
      console.error("Failed to load password requests:", err);
    } finally {
      setFetchingRequests(false);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Securely encrypt the password so it is never stored in plain text inside Firestore
      const encryptedNewPassword = encryptText(newPassword);

      await addDoc(collection(db, 'passwordRequests'), {
        userId: user.uid,
        userEmail: user.email || '',
        encryptedNewPassword,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      setSuccess('Your password change request has been submitted to the administrator for review.');
      setNewPassword('');
      setConfirmPassword('');
      fetchUserRequests();
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account credentials securely.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Request Password Change</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </button>
          </form>
        </div>

        {/* Security Info Column */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Security & Privacy</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            To prevent credential leaks, we use a custom-designed asymmetric/symmetric encryption algorithm. 
            Your proposed password is fully encrypted on your device before storing. 
            No plain-text version is stored or visible in the database.
          </p>
          <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded border border-blue-100">
            <strong>Verification Required:</strong> Password change requests are checked and verified by an authorized administrator before being committed.
          </div>
        </div>
      </div>

      {/* Notifications / Request Logs Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Request Notifications</h2>
          <p className="text-xs text-gray-500 mt-1">Track the status of your security change requests.</p>
        </div>

        {fetchingRequests ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-500">No security requests filed yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div 
                key={req.id} 
                className="p-4 border border-gray-100 rounded-lg flex items-center justify-between bg-gray-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-400">Request ID: {req.id}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">Submitted: {new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                  {req.status === 'rejected' && req.rejectReason && (
                    <p className="text-xs text-red-600 font-medium">Reason for Rejection: {req.rejectReason}</p>
                  )}
                </div>

                <div>
                  {req.status === 'pending' && (
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                      <Clock className="w-3 h-3 mr-1" /> Pending Admin Review
                    </span>
                  )}
                  {req.status === 'approved' && (
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approved & Updated
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
                      <XCircle className="w-3 h-3 mr-1" /> Request Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
