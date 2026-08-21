import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSMMServices, Service } from '../lib/smm';

export function ServicesContent({ isWidget = false }: { isWidget?: boolean }) {
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // 1. Fetch from SMM helper (handles API and client fallbacks)
        let loadedServices: Service[] = [];
        try {
          loadedServices = await fetchSMMServices();
        } catch (apiErr) {
          console.error('Failed to fetch from SMM helper:', apiErr);
        }

        // 2. Fetch from Firestore (for overrides / status custom edits / custom services)
        let firestoreServices: Service[] = [];
        try {
          const servicesRef = collection(db, 'services');
          const q = query(servicesRef);
          const querySnapshot = await getDocs(q);
          firestoreServices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Service));
        } catch (fsErr) {
          console.error('Failed to fetch from Firestore:', fsErr);
        }

        // 3. Merge SMM API services and Firestore overrides/custom services
        const mergedServicesMap: Record<string, Service> = {};
        loadedServices.forEach((s) => {
          mergedServicesMap[s.id] = s;
        });

        firestoreServices.forEach((fsSrv) => {
          mergedServicesMap[fsSrv.id] = {
            ...mergedServicesMap[fsSrv.id],
            ...fsSrv
          };
        });

        let finalServices = Object.values(mergedServicesMap);

        // For regular users, filter only active services
        if (!isAdmin) {
          finalServices = finalServices.filter(s => s.status === 'active');
        }

        setServices(finalServices);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [isAdmin]);

  const platforms = ['All', ...Array.from(new Set(services.map(s => s.platform)))];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || service.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className={isWidget ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
      {!isWidget && (
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-2 text-sm text-gray-700">A comprehensive list of all available social media marketing services.</p>
          </div>
        </div>
      )}

      <div className={`${isWidget ? 'mt-4' : 'mt-8'} sm:flex sm:items-center space-y-4 sm:space-y-0 sm:space-x-4`}>
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md sm:max-w-xs"
        >
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Platform</th>
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
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{service.id.slice(0, 8)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{service.platform}</td>
                        <td className="px-3 py-4 text-sm text-gray-900">{service.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₹{service.price.toFixed(2)}</td>
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
    <div className="md:ml-64">
      <ServicesContent />
    </div>
  );
}
