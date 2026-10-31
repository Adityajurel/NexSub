import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[#f5c875] text-[#171717] hover:bg-[#f8d28d] focus:ring-[#d9a94f] border border-[#e7b962] shadow-sm',
  secondary: 'bg-[#fffdf9] text-[#3d3934] hover:bg-[#f7f1e5] focus:ring-[#d9cdb9] border border-[#ded7cb] shadow-sm',
  brand: 'bg-[#171717] text-white hover:bg-[#302d29] focus:ring-[#f5c875] border border-transparent shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 border border-transparent shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent',
  outline: 'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50'
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md',
  md: 'px-3.5 py-2 text-sm rounded-md',
  lg: 'px-4 py-2.5 text-base rounded-lg'
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-1.5" />
      ) : null}
      {children}
    </button>
  );
};
