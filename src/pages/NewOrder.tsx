import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, RefreshCw, Search, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { fetchSMMServices, Service, APP_PLATFORMS, getAppForService } from '../lib/smm';

export function NewOrderContent({ isWidget = false }: { isWidget?: boolean }) {
  const { user, userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedApp, setSelectedApp] = useState('All Apps');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const location = useLocation();

  const [refreshing, setRefreshing] = useState(false);

  const loadServices = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const finalServices = await fetchSMMServices(force);
      const activeServices = finalServices.filter(s => s.status !== 'inactive');
      setServices(activeServices);
      
      const uniqueCategories = Array.from(new Set(activeServices.map(s => s.category)));
      setCategories(uniqueCategories);
      
      const params = new URLSearchParams(location.search);
      const prefillServiceId = params.get('service');
      const srv = activeServices.find(s => s.id === prefillServiceId);
      
      if (srv) {
        const appName = getAppForService(srv);
        setSelectedApp(appName);
        setSelectedCategory(srv.category);
        setSelectedServiceId(srv.id);
      } else if (!selectedCategory && uniqueCategories.length > 0) {
        setSelectedApp('All Apps');
        setSelectedCategory(uniqueCategories[0]);
        const firstService = activeServices.find(s => s.category === uniqueCategories[0]);
        if (firstService) setSelectedServiceId(firstService.id);
      }
    } catch (err) {
      console.error("Global fetchServices Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [location]);

  const availableApps = React.useMemo(() => {
    const appsSet = new Set<string>(APP_PLATFORMS);
    services.forEach(s => appsSet.add(getAppForService(s)));
    return Array.from(appsSet);
  }, [services]);

  const filteredCategories = React.useMemo(() => {
    if (selectedApp === 'All Apps') {
      return categories;
    }
    return Array.from(new Set(
      services.filter(s => getAppForService(s) === selectedApp).map(s => s.category)
    ));
  }, [services, selectedApp, categories]);

  const filteredServices = React.useMemo(() => {
    return services.filter(s => {
      const matchApp = selectedApp === 'All Apps' || getAppForService(s) === selectedApp;
      const matchCat = !selectedCategory || s.category === selectedCategory;
      return matchApp && matchCat;
    });
  }, [services, selectedApp, selectedCategory]);

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
          credentials: 'include',
          body: JSON.stringify({
            service: checkoutServiceId,
            link,
            quantity: qty
          })
        });

        // If an intermediate proxy returns 405, retry with alternative route
        if (apiResponse.status === 405) {
          try {
            apiResponse = await fetch('/api/smm/order/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                service: checkoutServiceId,
                link,
                quantity: qty
              })
            });
          } catch (retryErr) {
            console.warn("Retry failed:", retryErr);
          }
        }
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
      const orderRef = doc(collection(db, 'orders'));
      const txRef = doc(collection(db, 'transactions'));

      // Atomically deduct balance AND create the order and transaction log in one single commit!
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("User record does not exist.");
        }
        
        const currentBalance = userSnap.data().balance || 0;
        const currentTotalSpent = userSnap.data().totalSpent || 0;
        
        if (currentBalance < orderCharge) {
          throw new Error(`Insufficient balance. Current balance is ₹${currentBalance.toFixed(2)}, required is ₹${orderCharge.toFixed(2)}.`);
        }
        
        // 1. Transactionally update user balance
        transaction.update(userRef, {
          balance: currentBalance - orderCharge,
          totalSpent: currentTotalSpent + orderCharge,
          updatedAt: Date.now()
        });

        // 2. Transactionally create order record in the same atomic commit
        transaction.set(orderRef, {
          userId: user.uid,
          serviceId: String(checkoutServiceId),
          serviceName: checkoutServiceName,
          link: link.trim(),
          quantity: qty,
          charge: orderCharge,
          providerOrderId: providerOrderId,
          status: 'Processing', 
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        // 3. Transactionally record wallet transaction in the same commit
        transaction.set(txRef, {
          userId: user.uid,
          amount: orderCharge,
          type: 'charge',
          status: 'completed',
          serviceName: checkoutServiceName,
          orderId: orderRef.id,
          createdAt: Date.now()
        });
      });
      
      setSuccess(`Order #${orderRef.id.slice(0, 8).toUpperCase()} placed successfully! (Provider ID: ${providerOrderId})`);
      setLink('');
      setQuantity('');
    } catch (err: any) {
      console.error("Order Placement Error:", err);
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

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-900 text-sm">
            <div className="flex items-start">
              <span className="text-lg mr-2">❌</span>
              <div className="flex-1">
                <p className="font-bold text-red-950">Order Execution Failed</p>
                <p className="whitespace-pre-line mt-1 font-medium">{error}</p>
                <p className="mt-2 text-xs text-red-700">
                  🛡️ <strong>Wallet Protected:</strong> No balance was deducted. Your funds remain securely stored in your wallet database.
                </p>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="p-4 mb-6 rounded-lg bg-green-50 border border-green-200 text-green-900 text-sm">
            <div className="flex items-start">
              <span className="text-lg mr-2">✅</span>
              <div className="flex-1">
                <p className="font-bold text-green-950">Order Placed Successfully!</p>
                <p className="whitespace-pre-line mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-semibold text-gray-900">{services.length} Live Services Loaded</span>
            <span>•</span>
            <span>{filteredServices.length} services in {selectedApp}</span>
          </div>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadServices(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{refreshing ? 'Syncing...' : 'Sync with API'}</span>
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Quick Find Any Service (by Provider ID or Name)
            </label>
            <span className="text-[11px] font-semibold text-blue-700">
              {services.length} Total Services Live
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim().length > 0) {
                  const queryLower = val.trim().toLowerCase();
                  // Check exact ID match first
                  const exactIdMatch = services.find(s => s.id === val.trim() || String(s.rate) === val.trim());
                  if (exactIdMatch) {
                    setSelectedApp(getAppForService(exactIdMatch));
                    setSelectedCategory(exactIdMatch.category);
                    setSelectedServiceId(exactIdMatch.id);
                    return;
                  }
                  // Check name match
                  const nameMatch = services.find(s => s.name.toLowerCase().includes(queryLower) || s.category.toLowerCase().includes(queryLower));
                  if (nameMatch) {
                    setSelectedApp(getAppForService(nameMatch));
                    setSelectedCategory(nameMatch.category);
                    setSelectedServiceId(nameMatch.id);
                  }
                }
              }}
              placeholder="Search provider ID (e.g. 6093, 6133, 6131) or name (e.g. followers, reels, likes)..."
              className="block w-full pl-9 pr-24 py-2 text-sm bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery.trim().length > 1 && (
            <div className="mt-2 max-h-48 overflow-y-auto bg-white border border-blue-200 rounded-lg shadow-sm divide-y divide-gray-100">
              {services
                .filter(s => 
                  s.id.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                  s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                  s.category.toLowerCase().includes(searchQuery.trim().toLowerCase())
                )
                .slice(0, 10)
                .map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedApp(getAppForService(s));
                      setSelectedCategory(s.category);
                      setSelectedServiceId(s.id);
                      setSearchQuery('');
                    }}
                    className={`p-2.5 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      selectedServiceId === s.id ? 'bg-blue-50/80 font-medium' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                          #{s.id}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">{s.name}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{s.category}</p>
                    </div>
                    <div className="text-right whitespace-nowrap pl-2">
                      <span className="font-bold text-emerald-600">₹{s.price.toFixed(2)}</span>
                      <span className="text-[10px] text-gray-400 block">/ 1k</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select App / Platform</label>
              <select
                value={selectedApp}
                onChange={(e) => {
                  const newApp = e.target.value;
                  setSelectedApp(newApp);
                  const cats = newApp === 'All Apps' 
                    ? categories
                    : Array.from(new Set(services.filter(s => getAppForService(s) === newApp).map(s => s.category)));
                  
                  const nextCat = cats.length > 0 ? cats[0] : '';
                  setSelectedCategory(nextCat);
                  const firstSrv = services.find(s => (newApp === 'All Apps' || getAppForService(s) === newApp) && (!nextCat || s.category === nextCat));
                  setSelectedServiceId(firstSrv ? firstSrv.id : '');
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="All Apps">All Apps / Platforms</option>
                {availableApps.map(app => <option key={app} value={app}>{app}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setSelectedCategory(newCat);
                  const firstSrv = services.find(s => (selectedApp === 'All Apps' || getAppForService(s) === selectedApp) && s.category === newCat);
                  if (firstSrv) {
                     setSelectedServiceId(firstSrv.id);
                  } else {
                     setSelectedServiceId('');
                  }
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select Category</option>
                {filteredCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {selectedCategory ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service (with Provider Service ID)</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select Service</option>
                  {filteredServices.map(s => (
                    <option key={s.id} value={s.id}>[#{s.id}] {s.name} (₹{s.price.toFixed(2)} / 1000)</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md p-6 text-gray-400 text-sm">
                Select an app and category first
              </div>
            )}
          </div>
        </div>

        {selectedService && (
          <div className="border-t border-gray-200 pt-6 space-y-6">
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded">
                Provider ID #{selectedService.id}
              </span>
              <span className="px-2 py-0.5 bg-white text-gray-700 rounded border border-gray-200">
                Min: {selectedService.minOrder.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 bg-white text-gray-700 rounded border border-gray-200">
                Max: {selectedService.maxOrder.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded">
                Rate: ₹{selectedService.price.toFixed(2)} per 1,000
              </span>
            </div>

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

            <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap justify-between items-center border border-gray-200 gap-2">
              <div>
                <span className="text-gray-500 text-xs block font-medium">Your Stored Balance</span>
                <span className="text-xl font-bold text-emerald-600">₹{(userData?.balance || 0).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs block font-medium">Total Order Cost</span>
                <span className="text-2xl font-black text-gray-900">₹{charge.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Connecting to SMM Provider...' : 'Submit Order'}
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
