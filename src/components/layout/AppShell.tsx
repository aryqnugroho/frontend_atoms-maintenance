import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* TopBar: fixed height, never scrolls */}
      <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Body: fills remaining height */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar: fills full height of body, never scrolls with content */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content: only this area scrolls */}
        <main className="main-content-bg flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
