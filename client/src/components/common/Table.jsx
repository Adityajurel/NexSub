import React from 'react';

export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50/75">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
};
