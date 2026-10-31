import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  Repeat,
  Receipt,
  CreditCard,
  LogOut,
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
                ? 'bg-[#f5c875] text-[#171717] border border-[#f8d28d] shadow-sm'
                : 'text-[#b8b0a4] hover:text-white hover:bg-[#292724]'
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
    <aside className="w-64 bg-[#171717] text-[#d8d1c5] flex flex-col shrink-0 border-r border-[#2b2926] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#2b2926] gap-3">
        <BrandLogo className="w-9 h-9 rounded-lg bg-white shadow-sm" />
        <div>
          <span className="font-black text-white text-base tracking-tight">NexSub</span>
          <span className="block text-[10px] text-[#a1988b] uppercase tracking-widest font-semibold">
            Subscription OS
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#a1988b]">
          {role === 'Admin' ? 'Main Menu' : role === 'Staff' ? 'Staff Console' : 'Customer Portal'}
        </div>

        {role === 'Admin' && renderNavLinks(adminCoreItems)}
        {role === 'Staff' && renderNavLinks(staffNavItems)}
        {role === 'Customer' && renderNavLinks(customerNavItems)}

        {/* Admin Secondary Configuration Collapsible */}
        {role === 'Admin' && (
          <div className="pt-3 mt-3 border-t border-[#2b2926]">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#a1988b] hover:text-white uppercase tracking-wider rounded-lg hover:bg-[#292724] transition-colors"
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
      <div className="p-3 border-t border-[#2b2926] bg-[#111111]/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#292724] border border-[#3a3631]">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-[#a1988b] truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-md text-[#a1988b] hover:text-[#f5c875] hover:bg-[#171717] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
