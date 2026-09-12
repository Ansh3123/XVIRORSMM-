import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSMMServices, Service, APP_PLATFORMS, getAppForService } from '../lib/smm';

export function ServicesContent({ isWidget = false }: { isWidget?: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedApp, setSelectedApp] = useState('All Apps');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadServices = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const finalServices = await fetchSMMServices(force);
      setServices(finalServices);
      setCategories(['All', ...Array.from(new Set(finalServices.map(s => s.category)))]);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const availableApps = useMemo(() => {
    const appsSet = new Set<string>(APP_PLATFORMS);
    services.forEach(s => appsSet.add(getAppForService(s)));
    return Array.from(appsSet);
  }, [services]);

  const filteredCategories = useMemo(() => {
    if (selectedApp === 'All Apps') {
      return categories;
    }
    const catsForApp = Array.from(new Set(
      services.filter(s => getAppForService(s) === selectedApp).map(s => s.category)
    ));
    return ['All', ...catsForApp];
  }, [services, selectedApp, categories]);

  const filteredServices = services.filter(s => {
    const matchApp = selectedApp === 'All Apps' || getAppForService(s) === selectedApp;
    const matchCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm);
    return matchApp && matchCategory && matchSearch;
  });

  return (
    <div className={isWidget ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
      {!isWidget && (
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-2 text-sm text-gray-700">A comprehensive list of all available social media marketing services.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>
              {services.length} Live Services Loaded
            </span>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => loadServices(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 rounded-md border border-gray-300 shadow-sm transition-colors disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{refreshing ? 'Syncing...' : 'Sync with API'}</span>
            </button>
          </div>
        </div>
      )}

      <div className={`${isWidget ? 'mt-4' : 'mt-8'} grid grid-cols-1 sm:grid-cols-3 gap-4`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search service name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            value={selectedApp}
            onChange={(e) => {
              const newApp = e.target.value;
              setSelectedApp(newApp);
              setSelectedCategory('All');
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="All Apps">All Apps / Platforms</option>
            {availableApps.map(app => <option key={app} value={app}>{app}</option>)}
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {filteredCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price per 1000</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Min / Max</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                        No services found.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 font-mono">{service.id}</td>
                        <td className="px-3 py-4 text-sm text-gray-900">{service.category}</td>
                        <td className="px-3 py-4 text-sm text-gray-900">{service.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₹{service.price.toFixed(4)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{service.minOrder} / {service.maxOrder}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                           <a href={`/order/new?service=${service.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">Order Now</a>
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

export default function Services() {
  return (
    <div>
      <ServicesContent />
    </div>
  );
}
