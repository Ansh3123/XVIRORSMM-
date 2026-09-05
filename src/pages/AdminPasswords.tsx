import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Check, X, ShieldAlert, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PasswordRequestDoc {
  id: string;
  userId: string;
  userEmail: string;
  encryptedNewPassword: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: number;
}

export default function AdminPasswords() {
  const { user, userData, loading: authLoading } = useAuth();
  const isSpecialAdmin = user?.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
  const isAdmin = userData?.role === 'admin' || isSpecialAdmin;
  
  const [requests, setRequests] = useState<PasswordRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    if (!isAdmin) return;
    try {
      const q = query(collection(db, 'passwordRequests'));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PasswordRequestDoc));
      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(loaded);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin]);

  const handleApprove = async (reqDoc: PasswordRequestDoc) => {
    if (!user) return;
    setProcessingId(reqDoc.id);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/approve-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          requestId: reqDoc.id,
          targetUserId: reqDoc.userId,
          encryptedNewPassword: reqDoc.encryptedNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      alert('Password change request approved successfully! The user password has been updated in Firebase Authentication.');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(`Approval failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent, reqId: string) => {
    e.preventDefault();
    if (!user || !rejectReason.trim()) return;
    setProcessingId(reqId);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/reject-password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          requestId: reqId,
          rejectReason: rejectReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      alert('Password change request rejected.');
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setProcessingId(null);
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
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-sm text-gray-500">You must be logged in as an administrator to access this area.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Password Change Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve user requested password updates securely.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No password change requests found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((req) => (
              <li key={req.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">User Email: {req.userEmail}</p>
                    <p className="text-xs text-gray-500">User ID: {req.userId}</p>
                    <p className="text-xs text-gray-400">Request ID: {req.id}</p>
                    <p className="text-xs text-gray-400">Created: {new Date(req.createdAt).toLocaleString()}</p>
                    {req.status === 'rejected' && req.rejectReason && (
                      <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100 max-w-md">
                        Rejection Reason: {req.rejectReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={processingId !== null}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors cursor-pointer"
                        >
                          {processingId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <Check className="w-3.5 h-3.5 mr-1" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          disabled={processingId !== null}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div>
                        {req.status === 'approved' ? (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {rejectingId === req.id && (
                  <form onSubmit={(e) => handleRejectSubmit(e, req.id)} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700">Reason for Rejection</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Invalid request parameters"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
