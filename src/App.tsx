import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import FirebaseSyncIndicator from './components/FirebaseSyncIndicator';

// Lazy loaded pages
const DashboardHome = React.lazy(() => import('./pages/DashboardHome'));
const Login = React.lazy(() => import('./pages/Login'));
const Services = React.lazy(() => import('./pages/Services'));
const NewOrder = React.lazy(() => import('./pages/NewOrder'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Tickets = React.lazy(() => import('./pages/Tickets'));

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminServices = React.lazy(() => import('./pages/AdminServices'));
const AdminDeposits = React.lazy(() => import('./pages/AdminDeposits'));
const AdminOrders = React.lazy(() => import('./pages/AdminOrders'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));

function PageLoader() {
  return null;
}

function FullPageLoader() {
  return null;
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
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  </AuthProvider>
    </>
  );
}
