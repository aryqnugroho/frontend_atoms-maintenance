import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Activity,
  ClipboardList,
  BookOpen,
  Settings,
  Users,
  Calendar,
  X,
  Plane,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ size?: number }>;
  roles: string[];
}

const navSections: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
    ],
  },
  {
    title: 'Modul Operasional',
    items: [
      { name: 'Work Order', path: '/work-orders', icon: FileText, roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
      { name: 'CNSD Readiness', path: '/cnsd', icon: CheckSquare, roles: ['Manager Teknik', 'Supervisor CNSD', 'Teknisi CNSD'] },
      { name: 'TFP Readiness', path: '/tfp', icon: Activity, roles: ['Manager Teknik', 'Supervisor TFP', 'Teknisi TFP'] },
      { name: 'Ground Check', path: '/ground-check', icon: Plane, roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
      { name: 'Grounding System', path: '/grounding', icon: Zap, roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
      { name: 'Reporting', path: '/reports', icon: ClipboardList, roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP'] },
      { name: 'Logbook', path: '/logbooks', icon: BookOpen, roles: ['Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
    ],
  },
  {
    title: 'Admin',
    items: [
      { name: 'User Management', path: '/admin/users', icon: Users, roles: ['Admin'] },
      { name: 'Shift Schedule', path: '/admin/schedules', icon: Calendar, roles: ['Admin', 'Manager Teknik'] },
    ],
  },
  {
    items: [
      { name: 'Profile Settings', path: '/profile', icon: Settings, roles: ['Admin', 'Manager Teknik', 'Supervisor CNSD', 'Supervisor TFP', 'Teknisi CNSD', 'Teknisi TFP'] },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => user?.role && item.roles.includes(user.role)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}

      {/* ─── Desktop Sidebar (relative in flex layout) ─── */}
      <aside
        className={cn(
          'hidden md:flex flex-col w-64 shrink-0',
          'bg-sidebar',
          'border-r border-[#1a2456]',
          'overflow-y-auto'
        )}
      >
        <SidebarContent sections={filteredSections} onClose={onClose} />
      </aside>

      {/* ─── Mobile Sidebar (fixed, slides in from left) ─── */}
      <aside
        className={cn(
          'md:hidden fixed top-14 left-0 bottom-0 z-40 w-64',
          'bg-sidebar',
          'border-r border-[#1a2456]',
          'overflow-y-auto flex flex-col',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <span className="text-sm font-semibold text-white/90">Menu</span>
          <button onClick={onClose} className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <SidebarContent sections={filteredSections} onClose={onClose} />
      </aside>
    </>
  );
};

/* ─── Shared nav content (reused by desktop & mobile sidebars) ─── */
const SidebarContent: React.FC<{ sections: NavSection[]; onClose: () => void }> = ({ sections, onClose }) => (
  <>
    <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
      {sections.map((section, si) => (
        <div key={si}>
          {section.title && (
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-white/40 font-semibold">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Footer */}
    <div className="p-4 border-t border-white/10 shrink-0">
      <p className="text-[10px] text-white/30 text-center">
        ATOMS-Maintenance v2.0
      </p>
    </div>
  </>
);
