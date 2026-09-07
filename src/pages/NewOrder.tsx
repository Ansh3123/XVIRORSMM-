import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { fetchSMMServices, Service } from '../lib/smm';

export function NewOrderContent({ isWidget = false }: { isWidget?: boolean }) {
  const { user, userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
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
        let finalServices: Service[] = [];
        try {
          finalServices = await fetchSMMServices();
        } catch (apiErr) {
          console.error('Failed to fetch SMM helper services:', apiErr);
        }
        
        // Filter out inactive services for customer views
        const activeServices = finalServices.filter(s => s.status !== 'inactive');
        setServices(activeServices);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(activeServices.map(s => s.category)));
        setCategories(uniqueCategories);
        
        // Prefill from URL if provided
        const params = new URLSearchParams(location.search);
        const prefillServiceId = params.get('service');
        const srv = activeServices.find(s => s.id === prefillServiceId);
        
        if (srv) {
           setSelectedCategory(srv.category);
           setSelectedServiceId(srv.id);
        } else if (uniqueCategories.length > 0) {
           setSelectedCategory(uniqueCategories[0]);
           const firstService = activeServices.find(s => s.category === uniqueCategories[0]);
           if (firstService) setSelectedServiceId(firstService.id);
        }
      } catch (err) {
        console.error("Global fetchServices Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [location, userData]);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const charge = selectedService && quantity ? (selectedService.price / 1000) * parseInt(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!selectedService || !user) return;
    
    // Immutable Capture at Checkout
    const checkoutServiceId = selectedService.id;
    const checkoutServiceName = selectedService.name;
    const checkoutServicePrice = selectedService.price;
    const checkoutMinOrder = selectedService.minOrder;
    const checkoutMaxOrder = selectedService.maxOrder;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < checkoutMinOrder || qty > checkoutMaxOrder) {
      setError(`Quantity must be between ${checkoutMinOrder} and ${checkoutMaxOrder}`);
      return;
    }

    const orderCharge = (checkoutServicePrice / 1000) * qty;

    if ((userData?.balance || 0) < orderCharge) {
      setError('Insufficient balance. Please add funds to your wallet.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // 1. Call the provider API first before debiting or creating order
      let apiResponse;
      try {
        apiResponse = await fetch('/api/smm/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: checkoutServiceId,
            link,
            quantity: qty
          })
        });
      } catch (apiErr: any) {
        console.error("Network error hitting SMM provider:", apiErr);
        setError(`Order Failed\nReason: Network error connecting to SMM provider (${apiErr.message || 'Unreachable'})`);
        setSubmitting(false);
        return;
      }

      let resData: any = {};
      let parseFailed = false;
      let rawText = '';
      try {
        rawText = await apiResponse.text();
        resData = JSON.parse(rawText);
      } catch (e) {
        parseFailed = true;
      }

      if (!apiResponse.ok || resData.error) {
        let providerError = '';
        if (resData.error) {
          providerError = resData.error;
        } else if (parseFailed && rawText) {
          const cleanText = rawText.replace(/<[^>]*>/g, '').trim();
          providerError = cleanText.slice(0, 150) || `Server responded with status ${apiResponse.status}`;
        } else {
          providerError = `Provider rejected order (Status ${apiResponse.status})`;
        }
        console.error("Provider Order Rejection:", providerError);
        setError(`Order Failed\nReason: ${providerError}`);
        setSubmitting(false);
        return;
      }

      const providerOrderId = String(resData.orderId || resData.order || '');
      const userRef = doc(db, 'users', user.uid);

      // 2. Transactionally lock and deduct the balance upon provider confirmation
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User record does not exist.");
        }
        
        const currentBalance = userSnap.data().balance || 0;
        const currentTotalSpent = userSnap.data().totalSpent || 0;
        
        if (currentBalance < orderCharge) {
          throw new Error("Insufficient balance. Please add funds to your wallet.");
        }
        
        transaction.update(userRef, {
          balance: currentBalance - orderCharge,
          totalSpent: currentTotalSpent + orderCharge,
          updatedAt: Date.now()
        });
      });

      // 3. Document the successful order with immutable checkout details
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        serviceId: checkoutServiceId,
        serviceName: checkoutServiceName,
        link,
        quantity: qty,
        charge: orderCharge,
        providerOrderId,
        status: 'Processing', 
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      setSuccess('Order placed successfully! Balance deducted.');
      setLink('');
      setQuantity('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to place order. Please try again.');
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
            

            {true && (
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
                    <option key={s.id} value={s.id}>{s.name} (₹{s.price.toFixed(4)} / 1000)</option>
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
              <span className="text-2xl font-bold text-gray-900">₹{charge.toFixed(4)}</span>
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
    <div>
      <NewOrderContent />
    </div>
  );
}
