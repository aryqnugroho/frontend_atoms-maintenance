import { useContext } from 'react';
import { ThemeContext } from '@/contexts/contextInstances';
import type { ThemeContextType } from '@/contexts/contextInstances';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
