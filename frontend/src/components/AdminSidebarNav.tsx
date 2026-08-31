'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  BarChart2,
  Users,
  FileText,
  Layers,
  Palette,
  Folder,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import Skeleton from './Skeleton';
import { Icon } from './Icon';

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface AdminSidebarNavProps {
  items: NavItem[];
}

const defaultIcons: Record<string, LucideIcon> = {
  Moderation: ShieldAlert,
  Statistics: BarChart2,
  Users: Users,
  Reports: FileText,
  Liquidators: Layers,
  'Color Palette': Palette,
};

export default function AdminSidebarNav({ items }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Simulate auth check completion
    const timer = setTimeout(() => setIsAuthResolved(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Initialize and handle collapsible state persistence and responsive behavior
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('admin_sidebar_collapsed');
      if (savedState !== null) {
        setIsCollapsed(savedState === 'true');
      } else if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    }

    const handleResize = () => {
      if (
        typeof window !== 'undefined' &&
        localStorage.getItem('admin_sidebar_collapsed') === null
      ) {
        if (window.innerWidth < 1024) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => {
          const next = !prev;
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_sidebar_collapsed', String(next));
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      }
      return next;
    });
  }, []);

  if (!isAuthResolved) {
    return (
      <nav
        className="sticky top-0 z-40 bg-white dark:bg-stone-800 border-b lg:border-b-0 lg:border-r border-brown/10 dark:border-cream/10 shadow-sm p-4 w-full lg:w-64"
        aria-label="Admin navigation (loading)"
      >
        <div className="flex flex-col gap-4">
          <div className="skeleton-shimmer h-6 w-24 mb-2" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <aside
      className={`sticky top-0 z-40 bg-white dark:bg-stone-800 border-b lg:border-b-0 lg:border-r border-brown/10 dark:border-cream/10 shadow-sm transition-all duration-300 ease-in-out shrink-0 ${
        isCollapsed ? 'w-full lg:w-16' : 'w-full lg:w-64'
      }`}
    >
      <nav
        className="p-3 flex flex-col h-full"
        aria-label="Admin navigation"
        data-collapsed={isCollapsed}
      >
        {/* Top Header with Expand/Collapse button */}
        <div
          className={`flex items-center justify-between pb-3 border-b border-brown/10 dark:border-cream/10 mb-3 ${
            isCollapsed ? 'justify-center' : 'px-2'
          }`}
        >
          {!isCollapsed && (
            <span className="font-semibold text-xs uppercase tracking-wider text-brown/60 dark:text-cream/60">
              Admin Menu
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            className="p-2 rounded-lg text-brown/70 dark:text-cream/70 hover:bg-brown/10 dark:hover:bg-cream/10 hover:text-brown dark:hover:text-cream transition flex items-center justify-center min-h-[44px] min-w-[44px]"
          >
            <Icon icon={isCollapsed ? ChevronRight : ChevronLeft} size="md" aria-hidden="true" />
          </button>
        </div>

        {/* Nav Items List */}
        <div className={`flex ${isCollapsed ? 'flex-col gap-2' : 'flex-col gap-1'}`}>
          {items.map((item) => {
            const IconComponent = item.icon || defaultIcons[item.label] || Folder;
            const isActive = pathname === item.href;

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition min-h-[44px] ${
                    isActive
                      ? 'bg-gold/10 border-l-4 border-gold text-gold font-semibold'
                      : 'border-l-4 border-transparent text-brown/70 dark:text-cream/70 hover:text-brown dark:hover:text-cream hover:bg-brown/5 dark:hover:bg-cream/5 font-medium'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    icon={IconComponent}
                    size="md"
                    className="shrink-0 text-current"
                    aria-hidden="true"
                  />
                  <span className={isCollapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                </Link>

                {/* Tooltip visible on hover/focus when sidebar is collapsed */}
                {isCollapsed && (
                  <span
                    role="tooltip"
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
