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
 * Admin reports page — #802
 * Tables use zebra striping + hover highlight via AdminTable / AdminTableRow.
 */

const REPORT_COLUMNS = ['Report Name', 'Period', 'Generated', 'Actions'];
const ERROR_LOG_COLUMNS = ['Timestamp', 'Level', 'Message', 'Source'];

interface ReportRow {
  id: string;
  name: string;
  period: string;
  generated: string;
  downloadUrl: string;
}

interface ErrorLogRow {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source: string;
}

const DEMO_REPORTS: ReportRow[] = [
  { id: '1', name: 'Daily Summary', period: 'Daily', generated: '2026-08-26', downloadUrl: '#' },
  { id: '2', name: 'Weekly Report', period: 'Weekly', generated: '2026-08-25', downloadUrl: '#' },
  { id: '3', name: 'Monthly Summary', period: 'Monthly', generated: '2026-08-01', downloadUrl: '#' },
];

const DEMO_ERROR_LOGS: ErrorLogRow[] = [];

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const pageData = useMemo(
    () => ({
      pageName: 'Reports',
      routePath: 'reports',
    }),
    []
  );

  useEffect(() => {
    dispatch(setCurrentPage(pageData));
  }, [dispatch, pageData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card
          header={
            <h2 className="text-xl font-semibold text-brown dark:text-cream">System Reports</h2>
          }
        >
          <AdminTable columns={REPORT_COLUMNS} caption="System reports table">
            {DEMO_REPORTS.map((report, index) => (
              <AdminTableRow key={report.id} index={index}>
                <AdminTableCell className="font-medium">{report.name}</AdminTableCell>
                <AdminTableCell>{report.period}</AdminTableCell>
                <AdminTableCell>{report.generated}</AdminTableCell>
                <AdminTableCell>
                  <a
                    href={report.downloadUrl}
                    className="text-gold-600 hover:text-gold-700 dark:text-gold-400 hover:underline text-sm font-medium"
                  >
                    Download
                  </a>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        </Card>

        <Card
          header={<h2 className="text-xl font-semibold text-brown dark:text-cream">Error Logs</h2>}
        >
          <AdminTable columns={ERROR_LOG_COLUMNS} caption="Error logs table">
            {DEMO_ERROR_LOGS.length === 0 ? (
              <tr>
                <td
                  colSpan={ERROR_LOG_COLUMNS.length}
                  className="px-4 py-8 text-center text-sm text-brown/60 dark:text-cream/60"
                >
                  No errors detected.
                </td>
              </tr>
            ) : (
              DEMO_ERROR_LOGS.map((log, index) => (
                <AdminTableRow key={log.id} index={index}>
                  <AdminTableCell className="font-mono text-xs">{log.timestamp}</AdminTableCell>
                  <AdminTableCell>{log.level}</AdminTableCell>
                  <AdminTableCell>{log.message}</AdminTableCell>
                  <AdminTableCell>{log.source}</AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </Card>
      </div>
    </AdminLayout>
  );
}
