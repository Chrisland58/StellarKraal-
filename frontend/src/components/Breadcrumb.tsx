'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Human-readable label overrides for specific path segments.
 * Dynamic segments (e.g. collateral IDs) fall back to the raw segment value.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  collateral: 'Collateral',
};

interface Crumb {
  label: string;
  href: string;
}

/**
 * Builds a crumb list from a pathname string.
 * e.g. "/dashboard/collateral/abc-123" →
 *   [{ label: 'Dashboard', href: '/dashboard' },
 *    { label: 'Collateral', href: '/dashboard/collateral' },
 *    { label: 'abc-123', href: '/dashboard/collateral/abc-123' }]
 */
export function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = SEGMENT_LABELS[segment] ?? segment;
    return { label, href };
  });
}

/**
 * Renders a breadcrumb trail for the current route.
 * Returns null when the path is not nested (≤1 segment deep),
 * so it is invisible on top-level pages like /dashboard.
 */
export default function Breadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  // Hide on top-level pages (e.g. /dashboard itself)
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-brown/70">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-brown/40 select-none">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium text-brown">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-brown hover:underline transition">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
