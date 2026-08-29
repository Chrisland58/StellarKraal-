'use client';

import { useEffect, useMemo } from 'react';
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

/**
 * Admin users page — #802
 * Table uses zebra striping + hover highlight via AdminTable / AdminTableRow.
 */

const USER_COLUMNS = ['Address', 'Loans', 'Collateral', 'Status'];

// Demo data shape — replace with real API data when available
interface UserRow {
  id: string;
  address: string;
  loans: number;
  collateral: number;
  status: string;
}

const DEMO_USERS: UserRow[] = [];

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const pageData = useMemo(
    () => ({
      pageName: 'Users',
      routePath: 'users',
    }),
    []
  );

  useEffect(() => {
    dispatch(setCurrentPage(pageData));
  }, [dispatch, pageData]);

  return (
    <AdminLayout>
      <Card
        header={
          <h2 className="text-xl font-semibold text-brown dark:text-cream">User Management</h2>
        }
      >
        <AdminTable columns={USER_COLUMNS} caption="User management table">
          {DEMO_USERS.length === 0 ? (
            <tr>
              <td
                colSpan={USER_COLUMNS.length}
                className="px-4 py-8 text-center text-sm text-brown/60 dark:text-cream/60"
              >
                No users found
              </td>
            </tr>
          ) : (
            DEMO_USERS.map((user, index) => (
              <AdminTableRow key={user.id} index={index}>
                <AdminTableCell className="font-mono text-xs">{user.address}</AdminTableCell>
                <AdminTableCell>{user.loans}</AdminTableCell>
                <AdminTableCell>{user.collateral}</AdminTableCell>
                <AdminTableCell>{user.status}</AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </AdminTable>
      </Card>
    </AdminLayout>
  );
}
