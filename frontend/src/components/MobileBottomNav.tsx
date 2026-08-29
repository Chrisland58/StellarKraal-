'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Beef,
  User,
} from 'lucide-react';
import { Icon } from '@/components/Icon';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Borrow', href: '/loans', icon: ClipboardList },
  { label: 'Collateral', href: '/collateral', icon: Beef },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-stone-800 border-t border-brown/10 dark:border-cream/10 shadow-lg safe-pb"
      aria-label="Mobile bottom navigation"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition min-h-[44px] ${
                isActive
                  ? 'text-gold'
                  : 'text-brown/60 dark:text-cream/60 hover:text-brown dark:hover:text-cream'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Lucide icon — decorative, label is the visible text below */}
              <Icon icon={item.icon} size="md" className="text-current" />
              <span className={`text-xs font-medium ${isActive ? 'block' : 'hidden'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
