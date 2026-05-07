import type { ReactNode } from 'react';
import { ThemeContext } from '@/contexts/contextInstances';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light-mode only — no-op provider
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {}, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}
