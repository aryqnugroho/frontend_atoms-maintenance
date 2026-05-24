import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { WelcomeModal } from './WelcomeModal';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Topbar: sticky, never scrolls away */}
      <Topbar />

      {/* Main content: scrollable */}
      <main id="main-content" className="main-content-bg flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Welcome modal — shows on every page load */}
      <WelcomeModal />
    </div>
  );
};
