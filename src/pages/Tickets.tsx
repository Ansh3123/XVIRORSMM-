import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: number;
}

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'tickets'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const loadedTickets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Ticket));
        loadedTickets.sort((a, b) => b.createdAt - a.createdAt);
        setTickets(loadedTickets);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !message) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        subject,
        status: 'Open',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // A subcollection ticket_messages could be added here
      setSubject('');
      setMessage('');
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="mt-2 text-sm text-gray-500">Need help? Contact XvirorSMM Support on Telegram <a href="https://t.me/Deleaxy" className="text-blue-600 hover:text-blue-500 font-medium">@Deleaxy</a> or open a ticket.</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Open New Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Order ID or general inquiry..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Describe your issue in detail..." />
          </div>
          <button type="submit" disabled={submitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Tickets</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {loading ? (
             <li className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" /></li>
          ) : tickets.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-500">No tickets found.</li>
          ) : (
            tickets.map((ticket) => (
              <li key={ticket.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                      <p className="text-sm text-gray-500">{format(ticket.createdAt, 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {ticket.status}
                    </span>
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
