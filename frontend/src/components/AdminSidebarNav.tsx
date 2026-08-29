'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Skeleton from './Skeleton';

interface NavItem {
  label: string;
  href: string;
}

interface AdminSidebarNavProps {
  items: NavItem[];
}

export default function AdminSidebarNav({ items }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    // Simulate auth check completion
    // In a real app, this would listen to auth state changes
    const timer = setTimeout(() => setIsAuthResolved(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!isAuthResolved) {
    return (
      <nav
        className="sticky top-0 z-40 bg-white dark:bg-stone-800 border-b border-brown/10 dark:border-cream/10 shadow-sm"
        aria-label="Admin navigation (loading)"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sticky top-0 z-40 bg-white dark:bg-stone-800 border-b border-brown/10 dark:border-cream/10 shadow-sm"
      aria-label="Admin navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-8">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-2 border-b-2 transition min-h-[44px] flex items-center ${
                pathname === item.href
                  ? 'border-gold text-gold font-semibold'
                  : 'border-transparent text-brown/60 dark:text-cream/60 hover:text-brown dark:hover:text-cream font-medium'
              }`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
