import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Layers, 
  ShoppingCart, 
  Wallet, 
  TicketIcon,
  Settings,
  LogOut,
  Users,
  X,
  Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (val: boolean) => void }) {
  const location = useLocation();
  const { userData, logout } = useAuth();
  const isAdmin = userData?.role === 'admin';

  const userNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Order', href: '/order/new', icon: PlusCircle },
    { name: 'Mass Order', href: '/order/mass', icon: Layers },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Services', href: '/services', icon: List },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Services', href: '/admin/services', icon: List },
    { name: 'Manage Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Wallet Requests', href: '/admin/deposits', icon: Wallet },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Redeem Codes', href: '/admin/redeem-codes', icon: Key },
  ];

  const navigation = isAdmin ? [...userNavigation, ...adminNavigation] : userNavigation;

  const content = (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900 h-full">
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-gray-900">
        <span className="text-xl font-bold text-white tracking-tight">XVIROR SMM</span>
        {mobileOpen && setMobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400 hover:text-white focus:outline-none">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={cn(
                  isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                    'mr-3 flex-shrink-0 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex bg-gray-800 p-4">
        <button
          onClick={logout}
          className="flex-shrink-0 w-full group block text-left"
        >
          <div className="flex items-center">
            <div>
              <LogOut className="inline-block h-5 w-5 rounded-full text-gray-400 group-hover:text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                Logout
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-800 z-20">
        {content}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileOpen && setMobileOpen(false)} aria-hidden="true" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
            {content}
          </div>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      )}
    </>
  );
}
