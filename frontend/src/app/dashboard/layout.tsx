import Breadcrumb from '@/components/Breadcrumb';

/**
 * Shared layout for all /dashboard routes.
 * The Breadcrumb component itself suppresses rendering on the top-level
 * /dashboard page (≤1 path segment), so it only appears on nested pages
 * like /dashboard/collateral and /dashboard/collateral/[id].
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <Breadcrumb />
      </div>
      {children}
    </>
  );
}
