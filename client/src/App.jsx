import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { RoleGate } from './components/layout/RoleGate';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Admin Pages
import { Overview as AdminOverview } from './pages/admin/Overview';
import { Products } from './pages/admin/Products';
import { Plans } from './pages/admin/Plans';
import { Customers } from './pages/admin/Customers';
import { StaffManagement } from './pages/admin/StaffManagement';
import { Quotations } from './pages/admin/Quotations';
import { Subscriptions } from './pages/admin/Subscriptions';
import { Invoices } from './pages/admin/Invoices';
import { Payments } from './pages/admin/Payments';
import { Taxes } from './pages/admin/Taxes';
import { Discounts } from './pages/admin/Discounts';
import { BillingRuns } from './pages/admin/BillingRuns';
import { Analytics } from './pages/admin/Analytics';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Settings } from './pages/admin/Settings';

// Staff Pages
import { StaffOverview } from './pages/staff/StaffOverview';

// Portal Pages
import { PortalOverview } from './pages/portal/PortalOverview';
import { PortalSubscriptions } from './pages/portal/PortalSubscriptions';
import { PortalInvoices } from './pages/portal/PortalInvoices';
import { PortalPayments } from './pages/portal/PortalPayments';
import { PortalProfile } from './pages/portal/PortalProfile';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'Customer') return <Navigate to="/portal/overview" replace />;
  if (user?.role === 'Staff') return <Navigate to="/staff/overview" replace />;
  return <Navigate to="/admin/overview" replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Authenticated Application Layout */}
      <Route element={<RoleGate />}>
        <Route element={<AppLayout />}>
          {/* Admin Routes */}
          <Route element={<RoleGate allowedRoles={['Admin']} />}>
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/plans" element={<Plans />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/quotations" element={<Quotations />} />
            <Route path="/admin/subscriptions" element={<Subscriptions />} />
            <Route path="/admin/invoices" element={<Invoices />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/taxes" element={<Taxes />} />
            <Route path="/admin/discounts" element={<Discounts />} />
            <Route path="/admin/billing-runs" element={<BillingRuns />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          {/* Staff Routes */}
          <Route element={<RoleGate allowedRoles={['Admin', 'Staff']} />}>
            <Route path="/staff/overview" element={<StaffOverview />} />
            <Route path="/staff/customers" element={<Customers />} />
            <Route path="/staff/quotations" element={<Quotations />} />
            <Route path="/staff/subscriptions" element={<Subscriptions />} />
            <Route path="/staff/invoices" element={<Invoices />} />
            <Route path="/staff/payments" element={<Payments />} />
          </Route>

          {/* Customer Portal Routes */}
          <Route element={<RoleGate allowedRoles={['Customer']} />}>
            <Route path="/portal/overview" element={<PortalOverview />} />
            <Route path="/portal/subscriptions" element={<PortalSubscriptions />} />
            <Route path="/portal/invoices" element={<PortalInvoices />} />
            <Route path="/portal/payments" element={<PortalPayments />} />
            <Route path="/portal/profile" element={<PortalProfile />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
