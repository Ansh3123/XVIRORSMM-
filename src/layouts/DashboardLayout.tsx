import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Still wait if it's the very first load to avoid layout flash, but do it silently or minimal
  if (loading) {
    return <div className="min-h-screen bg-gray-50" />; 
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
