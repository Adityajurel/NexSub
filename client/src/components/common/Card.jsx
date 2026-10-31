import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-[#fffdf9] border border-[#e5ded2] rounded-2xl shadow-[0_12px_30px_rgba(74,61,40,0.06)] ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-[#eee8df] flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-bold text-[#171717]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#8b857b] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
