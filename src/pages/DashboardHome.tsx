import { useAuth } from '../contexts/AuthContext';
import { Wallet, ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const { userData } = useAuth();

  const stats = [
    { name: 'Wallet Balance', stat: `₹${userData?.balance?.toFixed(2) || '0.00'}`, icon: Wallet },
    { name: 'Total Spent', stat: `₹${userData?.totalSpent?.toFixed(2) || '0.00'}`, icon: ShoppingCart },
    { name: 'Active Orders', stat: '0', icon: Clock },
    { name: 'Completed Orders', stat: '0', icon: CheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:ml-64">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Overview</h3>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-lg overflow-hidden border border-gray-200"
            >
              <dt>
                <div className="absolute bg-gray-900 rounded-md p-3">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-100">
                  <div className="text-sm">
                    <Link to={item.name.includes('Wallet') ? '/wallet' : '/orders'} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      View details<span className="sr-only"> {item.name} stats</span>
                    </Link>
                  </div>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Link to="/services" className="block mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-8 sm:p-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Services Catalog</h3>
            <p className="mt-2 text-blue-100 max-w-xl">Browse our complete list of social media marketing services including YouTube, Telegram, Instagram, and Facebook.</p>
          </div>
          <div className="hidden sm:block text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </Link>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Need Help?</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>If you have any questions or need assistance, our support team is available 24/7 on Telegram.</p>
          </div>
          <div className="mt-5">
            <a
              href="https://t.me/Deleaxy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
            >
              Contact @Deleaxy on Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
