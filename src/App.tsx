import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import FirebaseSyncIndicator from './components/FirebaseSyncIndicator';

// Pre-import core customer pages to render instantly under 3 seconds
import DashboardHome from './pages/DashboardHome';
import Login from './pages/Login';
import Services from './pages/Services';
import NewOrder from './pages/NewOrder';
import Wallet from './pages/Wallet';
import Orders from './pages/Orders';
import Tickets from './pages/Tickets';

// Keep admin dashboards lazy loaded for modular code splitting
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminServices = React.lazy(() => import('./pages/AdminServices'));
const AdminDeposits = React.lazy(() => import('./pages/AdminDeposits'));
const AdminOrders = React.lazy(() => import('./pages/AdminOrders'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminRedeemCodes = React.lazy(() => import('./pages/AdminRedeemCodes'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-sm font-semibold tracking-tight text-gray-500">Syncing database...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AuthProvider>
        <ToastProvider>
          <FirebaseSyncIndicator />
          <Router>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<DashboardLayout />}>
              <Route path="/" element={
                <Suspense fallback={<PageLoader />}>
                  <DashboardHome />
                </Suspense>
              } />
              <Route path="/services" element={
                <Suspense fallback={<PageLoader />}>
                  <Services />
                </Suspense>
              } />
              <Route path="/order/new" element={
                <Suspense fallback={<PageLoader />}>
                  <NewOrder />
                </Suspense>
              } />
              <Route path="/orders" element={
                <Suspense fallback={<PageLoader />}>
                  <Orders />
                </Suspense>
              } />
              <Route path="/wallet" element={
                <Suspense fallback={<PageLoader />}>
                  <Wallet />
                </Suspense>
              } />
              <Route path="/tickets" element={
                <Suspense fallback={<PageLoader />}>
                  <Tickets />
                </Suspense>
              } />
              
              <Route path="/admin" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              } />
              <Route path="/admin/services" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminServices />
                </Suspense>
              } />
              <Route path="/admin/deposits" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDeposits />
                </Suspense>
              } />
              <Route path="/admin/orders" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminOrders />
                </Suspense>
              } />
              <Route path="/admin/users" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminUsers />
                </Suspense>
              } />
              <Route path="/admin/redeem-codes" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminRedeemCodes />
                </Suspense>
              } />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  </AuthProvider>
    </>
  );
}
