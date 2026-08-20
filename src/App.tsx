import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import DashboardHome from './pages/DashboardHome';
import Login from './pages/Login';
import Services from './pages/Services';
import NewOrder from './pages/NewOrder';
import Wallet from './pages/Wallet';
import Orders from './pages/Orders';
import Tickets from './pages/Tickets';

import AdminDashboard from './pages/AdminDashboard';
import AdminServices from './pages/AdminServices';
import AdminDeposits from './pages/AdminDeposits';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/services" element={<Services />} />
            <Route path="/order/new" element={<NewOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/tickets" element={<Tickets />} />
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/deposits" element={<AdminDeposits />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
