import { useContext } from 'react';
import { AuthContext } from '@/contexts/contextInstances';
import type { AuthContextType } from '@/contexts/contextInstances';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
