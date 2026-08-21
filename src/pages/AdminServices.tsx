import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Plus, Edit2, Trash2, ShieldAlert, DownloadCloud } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  platform: string;
  category: string;
  name: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  status: string;
}

export default function AdminServices() {
  const { userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service>>({ status: 'active' });

  const fetchServices = async () => {
    if (userData?.role !== 'admin') return;
    setLoading(true);
    try {
      // 1. Fetch from SMM API first as the default source
      let apiServicesMap: Record<string, Service> = {};
      try {
        const res = await fetch('/api/smm/sync', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.services) {
          data.services.forEach((s: any) => {
            const originalPrice = parseFloat(s.rate || '0');
            const markup = originalPrice > 5 ? 4 : 2;
            apiServicesMap[String(s.service)] = {
              id: String(s.service),
              platform: s.category ? s.category.trim().split(' ')[0] : 'Other',
              category: s.category || 'Default',
              name: s.name || `Service ${s.service}`,
              price: originalPrice + markup,
              minOrder: parseInt(s.min || '0'),
              maxOrder: parseInt(s.max || '0'),
              status: 'active'
            };
          });
        }
      } catch (apiErr) {
        console.error('Failed to fetch SMM API services:', apiErr);
      }

      // 2. Fetch from Firestore
      let firestoreServices: Service[] = [];
      try {
        const q = query(collection(db, 'services'));
        const querySnapshot = await getDocs(q);
        firestoreServices = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Service));
      } catch (fsErr) {
        console.error('Failed to fetch Firestore services:', fsErr);
      }

      // 3. Merge SMM API services and Firestore overrides/custom services
      const mergedServicesMap = { ...apiServicesMap };
      firestoreServices.forEach((fsSrv) => {
        mergedServicesMap[fsSrv.id] = {
          ...mergedServicesMap[fsSrv.id],
          ...fsSrv
        };
      });

      setServices(Object.values(mergedServicesMap));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [userData]);

  if (userData?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
        <ShieldAlert className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-sm">You do not have permission to view this page. You must be an administrator.</p>
        <p className="mt-4 text-xs text-gray-400">To test this, change your role to 'admin' in Firestore manually.</p>
      </div>
    );
  }

  const handleBroadcast = async () => {
    const title = window.prompt("Enter Notification Title:");
    if (!title) return;
    const message = window.prompt("Enter Notification Message:");
    if (!message) return;

    try {
      await addDoc(collection(db, 'broadcasts'), {
        title,
        message,
        createdAt: Date.now()
      });
      alert('Broadcast sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send broadcast');
    }
  };

  const handleSyncAPI = async () => {
    if (!window.confirm('This will fetch services from the SMM provider API. Proceed?')) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/smm/sync', { method: 'POST' });
      const data = await res.json();
      
      if (data.success && data.services) {
        let count = 0;
        
        // Use batch to perform efficient writes, but split into 400 document chunks just in case
        // The API provides items in array, e.g. { service, name, category, rate, min, max }
        const chunkSize = 400;
        for (let i = 0; i < data.services.length; i += chunkSize) {
          const chunk = data.services.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          
          for (const s of chunk) {
            const serviceRef = doc(collection(db, 'services'), String(s.service));
            const platformGuess = s.category ? s.category.trim().split(' ')[0] : 'Other';
            const originalPrice = parseFloat(s.rate || '0');
            const markup = originalPrice > 5 ? 4 : 2;
            const serviceData = {
              platform: platformGuess,
              category: s.category || 'Default',
              name: s.name || `Service ${s.service}`,
              price: originalPrice + markup,
              minOrder: parseInt(s.min || '0'),
              maxOrder: parseInt(s.max || '0'),
              status: 'active',
              updatedAt: Date.now()
            };
            // Use setDoc via batch (will overwrite existing or create new with fixed ID)
            batch.set(serviceRef, { ...serviceData, createdAt: Date.now() }, { merge: true });
            count++;
          }
          await batch.commit();
        }
        
        alert(`Successfully synced ${count} services from API!`);
        fetchServices();
      } else {
         alert('Failed to sync API services. Backend returned error.');
      }
    } catch (err) {
      console.error(err);
      alert('Error syncing API services.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceData = {
        platform: currentService.platform,
        category: currentService.category,
        name: currentService.name,
        price: Number(currentService.price),
        minOrder: Number(currentService.minOrder),
        maxOrder: Number(currentService.maxOrder),
        status: currentService.status,
        updatedAt: Date.now()
      };

      if (currentService.id) {
        // Update (uses setDoc with merge so it works for default API services not yet in Firestore)
        await setDoc(doc(db, 'services', currentService.id), serviceData, { merge: true });
      } else {
        // Create
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: Date.now()
        });
      }
      setIsEditing(false);
      setCurrentService({ status: 'active' });
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleBroadcast}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Broadcast
          </button>
          <button
            onClick={handleSyncAPI}
            disabled={isSyncing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : <DownloadCloud className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />}
            {isSyncing ? 'Syncing API...' : 'Sync API Services'}
          </button>
          <button
            onClick={() => {
              setCurrentService({ status: 'active' });
              setIsEditing(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Service
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{currentService.id ? 'Edit Service' : 'Add New Service'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <input type="text" required value={currentService.platform || ''} onChange={e => setCurrentService({...currentService, platform: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input type="text" required value={currentService.category || ''} onChange={e => setCurrentService({...currentService, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Service Name</label>
              <input type="text" required value={currentService.name || ''} onChange={e => setCurrentService({...currentService, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Price (per 1000)</label>
              <input type="number" step="0.01" required value={currentService.price || ''} onChange={e => setCurrentService({...currentService, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Min</label>
              <input type="number" required value={currentService.minOrder || ''} onChange={e => setCurrentService({...currentService, minOrder: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Max</label>
              <input type="number" required value={currentService.maxOrder || ''} onChange={e => setCurrentService({...currentService, maxOrder: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={currentService.status} onChange={e => setCurrentService({...currentService, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">Cancel</button>
              <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                      </td>
                    </tr>
                  ) : services.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No services found. Add one above.</td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{service.id.slice(0, 8)}</td>
                        <td className="px-3 py-4 text-sm text-gray-900">{service.platform} - {service.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₹{service.price.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {service.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button onClick={() => { setCurrentService(service); setIsEditing(true); }} className="text-blue-600 hover:text-blue-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
