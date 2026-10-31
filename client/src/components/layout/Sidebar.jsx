import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  Repeat,
  Receipt,
  CreditCard,
  LogOut,
  Layers,
  User,
  Settings,
  Percent,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  // Core high-frequency navigation
  const adminCoreItems = [
    { label: 'Dashboard', to: '/admin/overview', icon: LayoutDashboard },
    { label: 'Subscriptions', to: '/admin/subscriptions', icon: Repeat },
    { label: 'Invoices & Billing', to: '/admin/invoices', icon: Receipt },
    { label: 'Payments', to: '/admin/payments', icon: CreditCard },
    { label: 'Catalog & Plans', to: '/admin/products', icon: Package },
    { label: 'Customers', to: '/admin/customers', icon: Users },
  ];

  // Secondary configuration items
  const adminConfigItems = [
    { label: 'Quotations', to: '/admin/quotations', icon: FileText },
    { label: 'Taxes & Rules', to: '/admin/taxes', icon: Percent },
    { label: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  const staffNavItems = [
    { label: 'Dashboard', to: '/staff/overview', icon: LayoutDashboard },
    { label: 'Subscriptions', to: '/staff/subscriptions', icon: Repeat },
    { label: 'Invoices', to: '/staff/invoices', icon: Receipt },
    { label: 'Payments', to: '/staff/payments', icon: CreditCard },
    { label: 'Customers', to: '/staff/customers', icon: Users },
  ];

  const customerNavItems = [
    { label: 'Dashboard', to: '/portal/overview', icon: LayoutDashboard },
    { label: 'My Subscriptions', to: '/portal/subscriptions', icon: Repeat },
    { label: 'Invoices & Payments', to: '/portal/invoices', icon: Receipt },
    { label: 'Account Profile', to: '/portal/profile', icon: User },
  ];

  const renderNavLinks = (items) => (
    items.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-800 text-sky-400 border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`
          }
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      );
    })
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">NexSub</span>
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Subscription OS
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {role === 'Admin' ? 'Main Menu' : role === 'Staff' ? 'Staff Console' : 'Customer Portal'}
        </div>

        {role === 'Admin' && renderNavLinks(adminCoreItems)}
        {role === 'Staff' && renderNavLinks(staffNavItems)}
        {role === 'Customer' && renderNavLinks(customerNavItems)}

        {/* Admin Secondary Configuration Collapsible */}
        {role === 'Admin' && (
          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded-lg hover:bg-slate-800/40 transition-colors"
            >
              <span>Settings & Rules</span>
              {showConfig ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showConfig && (
              <div className="mt-1 space-y-1 pl-1">
                {renderNavLinks(adminConfigItems)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
