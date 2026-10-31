import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f4ec]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto bg-[#f7f4ec] p-5 md:p-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -right-32 top-12 h-72 w-72 rounded-full bg-[#eadfc9]/35 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#f0dfb8]/20 blur-3xl" />
          </div>
          <div className="relative z-10">
          <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
