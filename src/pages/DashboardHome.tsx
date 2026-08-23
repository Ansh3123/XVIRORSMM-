import { useAuth } from '../contexts/AuthContext';
import { Wallet, ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewOrderContent } from './NewOrder';

export default function DashboardHome() {
  const { userData } = useAuth();

  const stats = [
    { name: 'Wallet Balance', stat: `₹${userData?.balance?.toFixed(2) || '0.00'}`, icon: Wallet },
    { name: 'Total Spent', stat: `₹${userData?.totalSpent?.toFixed(2) || '0.00'}`, icon: ShoppingCart },
    { name: 'Active Orders', stat: '0', icon: Clock },
    { name: 'Completed Orders', stat: '0', icon: CheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mt-2">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Order</h3>
        <NewOrderContent isWidget={true} />
      </div>

      <div className="mt-8">
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

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Need Help?</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>If you have any questions or need assistance, our support team is available 24/7 on WhatsApp, Telegram, or via Email.</p>
          </div>
          <div className="mt-5 flex space-x-4 flex-wrap gap-y-4">
            <a
              href="https://wa.me/917069245078"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm transition-colors"
            >
              WhatsApp Support
            </a>
            <a
              href="https://t.me/Deleaxy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors"
            >
              Telegram Support
            </a>
            <a
              href="mailto:yourr.farhan@gmail.com"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
