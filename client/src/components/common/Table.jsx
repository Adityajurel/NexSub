import React from 'react';

export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-[#e5ded2] bg-[#fffdf9] shadow-[0_12px_30px_rgba(74,61,40,0.06)] ${className}`}>
      <table className="min-w-full divide-y divide-[#eee8df] text-left text-sm">
        <thead className="bg-[#f7f1e5]">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#716d65] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0ece5] bg-[#fffdf9]">{children}</tbody>
      </table>
    </div>
  );
};
