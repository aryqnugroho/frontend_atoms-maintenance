/**
 * This file holds all React context instances.
 * Keeping them separate from Provider components satisfies the
 * react-refresh/only-export-components lint rule, which requires
 * files to export only components OR only non-component values.
 */

import { createContext } from 'react';
import type { User, LoginCredentials, Notification } from '@/types';

// ─── Auth ─────────────────────────────────────────────────────
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Notification ─────────────────────────────────────────────
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  /** Force an immediate refetch (called after user actions like sign / create). */
  refresh: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─── Theme ────────────────────────────────────────────────────
export type Theme = 'light';
export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
