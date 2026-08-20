import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Users, ShoppingCart, List, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { userData } = useAuth();

  if (userData?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
        <ShieldAlert className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
      </div>
    );
  }

  const links = [
    { name: 'Manage Services', href: '/admin/services', icon: List, desc: 'Add or edit services' },
    { name: 'Manage Orders', href: '/admin/orders', icon: ShoppingCart, desc: 'View and update orders' },
    { name: 'Wallet Requests', href: '/admin/deposits', icon: Wallet, desc: 'Approve manual deposits' },
    { name: 'Manage Users', href: '/admin/users', icon: Users, desc: 'View users and balances' },
  ];

  return (
    <div className="max-w-7xl mx-auto md:ml-64 px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {links.map((link) => (
          <Link key={link.name} to={link.href} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <link.icon className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{link.name}</h3>
            <p className="mt-2 text-sm text-gray-500">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
