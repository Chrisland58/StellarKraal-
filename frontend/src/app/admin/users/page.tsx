'use client';

/**
 * AdminUsersPage — #558
 *
 * Displays a paginated table of users with:
 *  - Wallet address, loan count, collateral count, join date
 *  - Search by wallet address (client-side filter)
 *  - Status toggle (active ↔ suspended) guarded by ConfirmDialog
 *  - 20 rows per page default (configurable via Pagination)
 */

import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/adminSlice';
import { AppDispatch } from '@/store/store';
import AdminLayout from '@/components/AdminLayout';
import Card from '@/components/Card';
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
} from '@/components/AdminTable';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import { usePagination } from '@/hooks/usePagination';

// ── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  address: string;
  loans: number;
  collateral: number;
  joinDate: string;
  status: 'active' | 'suspended';
}

// ── Demo data (replace with API call when backend endpoint exists) ────────────

function buildDemoUsers(): UserRow[] {
  const base: Omit<UserRow, 'id'>[] = [
    { address: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJUQR34YHTQELBS3J3R13MRSO', loans: 3, collateral: 5, joinDate: '2025-01-15', status: 'active' },
    { address: 'GBYJZW5XFWAIEJ36IOLHQKM3CUYZXF3DQHE6WJAQKQNFNTKCN7PX3L', loans: 1, collateral: 2, joinDate: '2025-02-20', status: 'active' },
    { address: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBCXLLT8T55L6P7UXWCRT', loans: 0, collateral: 1, joinDate: '2025-03-05', status: 'suspended' },
    { address: 'GDFOHLMYCQBII4WZEKJZFL3CFWGZXMJFXMRHLRDGNKZRGHOCWTKZK2BS', loans: 5, collateral: 8, joinDate: '2025-01-02', status: 'active' },
    { address: 'GBOV6LGKZFMHQMTFNQCXH2KYDXAPCMGASCKC3VNHCIBQN2XFQBPSGBK', loans: 2, collateral: 3, joinDate: '2025-04-10', status: 'active' },
    { address: 'GCJKSAQECBGMABJJMNNO3D6YY7E3AOXQ74R3VBY5PIQNHH7LCH7V4XY', loans: 0, collateral: 0, joinDate: '2025-05-18', status: 'suspended' },
    { address: 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSOMERX', loans: 7, collateral: 10, joinDate: '2024-12-01', status: 'active' },
    { address: 'GC5STPTUCLTQMM7BEQ7AAQKQKXRRLXBMVXS6UJWNNQXEQ5J2OICOIG6', loans: 1, collateral: 1, joinDate: '2025-06-22', status: 'active' },
    { address: 'GBWKAGHLSSQPZ5GVDQVMRDV7ZZPNKEJSAQDMHCTMF6MTC2RJUOMYF62', loans: 4, collateral: 6, joinDate: '2025-02-14', status: 'active' },
    { address: 'GDRDMURTDMURDMHKFXNFNBMKDYBBDVVGFYTRGJHTZJIMTQTJBQJINLMA', loans: 0, collateral: 2, joinDate: '2025-07-01', status: 'suspended' },
    { address: 'GAHK7EEG2WWHVKDNT4CEQFZGKF4ZJTE3WHISBJINHS7XGH2JMKDAWHD3', loans: 2, collateral: 3, joinDate: '2024-11-20', status: 'active' },
    { address: 'GCTVCU6PF4YS5QL7LMF6HEZM4GXAVSLZPHK7SSPFXCMNJ2DSDKGFBTB', loans: 6, collateral: 9, joinDate: '2024-10-08', status: 'active' },
    { address: 'GBPHKZTGS422QHKVJ5L7MFYQTQ3A7IOPXBQHCXRNCWCHF7ICPHKNHF2', loans: 3, collateral: 5, joinDate: '2025-03-30', status: 'active' },
    { address: 'GDQZRNFZXDKPQJKJPKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJK', loans: 0, collateral: 0, joinDate: '2025-08-01', status: 'active' },
    { address: 'GBQ6M4ZEDIMVNKBJJLOLBX4ZTEVTQJKJKJKJKJKJKJKJKJKJKJKJKJK', loans: 1, collateral: 2, joinDate: '2025-07-14', status: 'suspended' },
    { address: 'GCPUVUVFPWGHMBTGJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPB', loans: 9, collateral: 12, joinDate: '2024-09-15', status: 'active' },
    { address: 'GDNMR5MHKTRGTJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPBJHVQ', loans: 2, collateral: 4, joinDate: '2025-01-28', status: 'active' },
    { address: 'GBHKPQJHKTRGTJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPBJHVQ', loans: 0, collateral: 1, joinDate: '2025-06-05', status: 'active' },
    { address: 'GCMKJHKTRGTJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPBJHVQZQ', loans: 5, collateral: 7, joinDate: '2025-02-02', status: 'active' },
    { address: 'GDPBQJHKTRGTJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPBJHVQZQ', loans: 1, collateral: 2, joinDate: '2025-05-09', status: 'suspended' },
    { address: 'GBRKJHKTRGTJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPBJHVQZQD', loans: 3, collateral: 3, joinDate: '2025-04-22', status: 'active' },
    { address: 'GCSKJHKTRGTJHVQZQDZMHBGHPUQHPBJHVQZQDZMHBGHPUQHPBJHVQZQD', loans: 0, collateral: 0, joinDate: '2025-08-12', status: 'active' },
  ];
  return base.map((u, i) => ({ ...u, id: `user-${i + 1}` }));
}

const ALL_USERS: UserRow[] = buildDemoUsers();

// ── Column headers ────────────────────────────────────────────────────────────

const USER_COLUMNS = ['Wallet Address', 'Loans', 'Collateral', 'Joined', 'Status', 'Action'];

// ── Page component ────────────────────────────────────────────────────────────

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();

  // Register current page for admin nav highlighting
  const pageData = useMemo(() => ({ pageName: 'Users', routePath: 'users' }), []);
  useEffect(() => {
    dispatch(setCurrentPage(pageData));
  }, [dispatch, pageData]);

  // ── Local state ─────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserRow[]>(ALL_USERS);
  const [search, setSearch] = useState('');

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<UserRow | null>(null);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.address.toLowerCase().includes(q));
  }, [users, search]);

  // ── Pagination (20 per page default) ────────────────────────────────────────
  const { page, limit, totalPages, setPage, setLimit, slice } = usePagination(filtered.length, 20);
  const pageRows = slice(filtered);

  // ── Status toggle ────────────────────────────────────────────────────────────
  function requestToggle(user: UserRow) {
    setPendingToggle(user);
    setConfirmOpen(true);
  }

  function confirmToggle() {
    if (!pendingToggle) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === pendingToggle.id
          ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
          : u
      )
    );
    setConfirmOpen(false);
    setPendingToggle(null);
  }

  function cancelToggle() {
    setConfirmOpen(false);
    setPendingToggle(null);
  }

  const nextStatus = pendingToggle?.status === 'active' ? 'suspended' : 'active';

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-brown dark:text-cream">User Management</h1>
          <p className="text-sm text-brown/60 dark:text-cream/60">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <label htmlFor="user-search" className="sr-only">
            Search by wallet address
          </label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-brown/40"
          >
            🔍
          </span>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by wallet address…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-brown/20 rounded-lg bg-white dark:bg-brown-800 dark:border-brown-600 dark:text-cream-50 placeholder-brown/40 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        {/* Table */}
        <Card>
          <AdminTable
            columns={USER_COLUMNS}
            caption="User management table — wallet addresses, loan counts, and account status"
          >
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={USER_COLUMNS.length}
                  className="px-4 py-8 text-center text-sm text-brown/60 dark:text-cream/60"
                >
                  {search ? `No users matching "${search}"` : 'No users found'}
                </td>
              </tr>
            ) : (
              pageRows.map((user, index) => (
                <AdminTableRow key={user.id} index={index}>
                  {/* Wallet address — truncated for narrow screens */}
                  <AdminTableCell className="font-mono text-xs max-w-[160px] truncate" title={user.address}>
                    {user.address}
                  </AdminTableCell>

                  {/* Loan count */}
                  <AdminTableCell className="text-center">{user.loans}</AdminTableCell>

                  {/* Collateral count */}
                  <AdminTableCell className="text-center">{user.collateral}</AdminTableCell>

                  {/* Join date */}
                  <AdminTableCell>
                    {new Date(user.joinDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </AdminTableCell>

                  {/* Status badge */}
                  <AdminTableCell>
                    <StatusBadge status={user.status} />
                  </AdminTableCell>

                  {/* Toggle action */}
                  <AdminTableCell>
                    <button
                      type="button"
                      onClick={() => requestToggle(user)}
                      className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                        user.status === 'active'
                          ? 'border-color-danger text-color-danger hover:bg-color-danger-subtle focus-visible:ring-color-danger'
                          : 'border-color-success text-color-success hover:bg-color-success-subtle focus-visible:ring-color-success'
                      }`}
                      aria-label={`${user.status === 'active' ? 'Suspend' : 'Activate'} user ${user.address}`}
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>

          {/* Pagination */}
          {filtered.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </Card>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={`${nextStatus === 'suspended' ? 'Suspend' : 'Activate'} User`}
        message={`Are you sure you want to ${nextStatus === 'suspended' ? 'suspend' : 'activate'} this user?\n\nWallet: ${pendingToggle?.address ?? ''}`}
        confirmLabel={nextStatus === 'suspended' ? 'Suspend' : 'Activate'}
        cancelLabel="Cancel"
        variant={nextStatus === 'suspended' ? 'destructive' : 'default'}
        destructiveAriaLabel={`Suspend user ${pendingToggle?.address ?? ''}`}
        onConfirm={confirmToggle}
        onCancel={cancelToggle}
      />
    </AdminLayout>
  );
}
