import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Topbar: sticky, never scrolls away */}
      <Topbar />

      {/* Main content: scrollable */}
      <main className="main-content-bg flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
