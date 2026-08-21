import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Service {
  id: string;
  platform: string;
  category: string;
  name: string;
  price: number;
  minOrder: number;
  maxOrder: number;
}

export function NewOrderContent({ isWidget = false }: { isWidget?: boolean }) {
  const { user, userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const location = useLocation();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        let loadedServices: Service[] = [];
        try {
          const q = query(collection(db, 'services'), where('status', '==', 'active'));
          const querySnapshot = await getDocs(q);
          loadedServices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Service));
        } catch (fsErr) {
          console.error("Firestore getDocs failed, falling back to API:", fsErr);
        }
        
        if (loadedServices.length === 0) {
          try {
            const res = await fetch('/api/smm/sync', { method: 'POST' });
            const data = await res.json();
            if (data.success && data.services) {
              loadedServices = data.services.map((s: any) => {
                const originalPrice = parseFloat(s.rate || '0');
                const markup = originalPrice > 5 ? 4 : 2;
                return {
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
            console.error('Fallback API failed:', apiErr);
          }
        }

        setServices(loadedServices);
        const uniquePlatforms = Array.from(new Set(loadedServices.map(s => s.platform)));
        setPlatforms(uniquePlatforms);

        // Pre-select if URL has service
        const params = new URLSearchParams(location.search);
        const prefillServiceId = params.get('service');
        if (prefillServiceId) {
           const srv = loadedServices.find(s => s.id === prefillServiceId);
           if (srv) {
              setSelectedPlatform(srv.platform);
           }
        } else if (uniquePlatforms.length > 0 && !selectedPlatform) {
           setSelectedPlatform(uniquePlatforms[0]);
        }
      } catch (err) {
        console.error("Global fetchServices Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [location]);

  useEffect(() => {
    if (selectedPlatform) {
      const platformServices = services.filter(s => s.platform === selectedPlatform);
      const uniqueCategories = Array.from(new Set(platformServices.map(s => s.category)));
      setCategories(uniqueCategories);
      
      const params = new URLSearchParams(location.search);
      const prefillServiceId = params.get('service');
      const srv = services.find(s => s.id === prefillServiceId);
      
      if (srv && srv.platform === selectedPlatform) {
         setSelectedCategory(srv.category);
         setSelectedServiceId(srv.id);
      } else if (uniqueCategories.length > 0) {
         setSelectedCategory(uniqueCategories[0]);
         const firstService = platformServices.find(s => s.category === uniqueCategories[0]);
         if (firstService) setSelectedServiceId(firstService.id);
      } else {
         setSelectedCategory('');
         setSelectedServiceId('');
      }
    }
  }, [selectedPlatform, services, location]);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const charge = selectedService && quantity ? (selectedService.price / 1000) * parseInt(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !user) return;
    
    const qty = parseInt(quantity);
    if (qty < selectedService.minOrder || qty > selectedService.maxOrder) {
      setError(`Quantity must be between ${selectedService.minOrder} and ${selectedService.maxOrder}`);
      return;
    }

    if ((userData?.balance || 0) < charge) {
      setError('Insufficient balance. Please add funds to your wallet.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const apiResponse = await fetch('/api/smm/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedService.id,
          link,
          quantity: qty
        })
      });

      if (!apiResponse.ok) {
        throw new Error('API Provider failed to process order');
      }

      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        serviceId: selectedService.id,
        link,
        quantity: qty,
        charge,
        status: 'Completed', 
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setSuccess('Order placed successfully!');
      setLink('');
      setQuantity('');
    } catch (err) {
      console.error(err);
      setError('Failed to place order with provider. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className={isWidget ? "" : "max-w-4xl mx-auto px-4 py-8"}>
      {!isWidget && <h1 className="text-2xl font-bold text-gray-900 mb-8">New Order</h1>}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                👉 Please public the account first then add the order
              </p>
            </div>
          </div>
        </div>

        {error && <div className="p-4 mb-6 rounded-md bg-red-50 text-red-800 text-sm">{error}</div>}
        {success && <div className="p-4 mb-6 rounded-md bg-green-50 text-green-800 text-sm">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select Platform</option>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {selectedPlatform && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedCategory(newCat);
                    const firstSrv = services.find(s => s.category === newCat);
                    if (firstSrv) {
                       setSelectedServiceId(firstSrv.id);
                    } else {
                       setSelectedServiceId('');
                    }
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedCategory ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Service</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select Service</option>
                  {services.filter(s => s.category === selectedCategory).map(s => (
                    <option key={s.id} value={s.id}>{s.name} (₹{s.price} / 1000)</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md p-6 text-gray-400 text-sm">
                Select a platform and category first
              </div>
            )}
          </div>
        </div>

        {selectedService && (
          <div className="border-t border-gray-200 pt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Link / URL</label>
              <input
                type="text"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                required
                min={selectedService.minOrder}
                max={selectedService.maxOrder}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Min: {selectedService.minOrder} - Max: {selectedService.maxOrder}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md flex justify-between items-center border border-gray-100">
              <span className="text-gray-700 font-medium">Total Charge:</span>
              <span className="text-2xl font-bold text-gray-900">₹{charge.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Processing via API...' : 'Submit Order'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewOrder() {
  return (
    <div className="md:ml-64">
      <NewOrderContent />
    </div>
  );
}
