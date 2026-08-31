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

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

interface ReportRow {
  id: number;
  date: string;
  type: string;
  borrower: string;
  amount: string;
  status: string;
  collateral: string;
}

const MOCK_REPORT_DATA: ReportRow[] = [
  {
    id: 1,
    date: '2026-08-01',
    type: 'Daily',
    borrower: 'G...ABC',
    amount: '500 XLM',
    status: 'Active',
    collateral: '2 Cattle',
  },
  {
    id: 2,
    date: '2026-08-07',
    type: 'Weekly',
    borrower: 'G...DEF',
    amount: '1,200 XLM',
    status: 'Repaid',
    collateral: '5 Goats',
  },
  {
    id: 3,
    date: '2026-08-01',
    type: 'Monthly',
    borrower: 'G...GHI',
    amount: '3,000 XLM',
    status: 'Liquidated',
    collateral: '10 Sheep',
  },
];

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/**
 * Safely escape a single CSV cell value.
 * Always wraps in double-quotes and escapes any internal double-quotes as "".
 */
export function escapeCsvCell(value: string): string {
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Convert an array of ReportRow objects to a RFC-4180-compliant CSV string.
 * The first row is derived from the object keys of the first element.
 */
export function buildCsvString(rows: ReportRow[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]) as (keyof ReportRow)[];
  const headerRow = headers.map((h) => escapeCsvCell(String(h))).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCsvCell(String(row[h]))).join(',')
  );

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Trigger a client-side CSV download for the given rows.
 */
export function downloadCsv(rows: ReportRow[]): void {
  const csv = buildCsvString(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const filename = `report-${new Date().toISOString().slice(0, 10)}.csv`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

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

  const hasData = MOCK_REPORT_DATA.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ----------------------------------------------------------------- */}
        {/* System Reports card                                                */}
        {/* ----------------------------------------------------------------- */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-brown dark:text-cream">
                System Reports
              </h2>
              <button
                onClick={() => downloadCsv(MOCK_REPORT_DATA)}
                disabled={!hasData}
                aria-label="Download report as CSV"
                className={
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' +
                  (hasData
                    ? 'bg-gold text-white hover:bg-gold/80 cursor-pointer'
                    : 'bg-brown/20 text-brown/40 dark:bg-cream/20 dark:text-cream/40 cursor-not-allowed')
                }
              >
                Download CSV
              </button>
            </div>
          }
        >
          {/* Report data table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-brown dark:text-cream">
              <thead>
                <tr className="border-b border-brown/20 dark:border-cream/20">
                  <th className="px-4 py-2 text-left font-semibold">ID</th>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Borrower</th>
                  <th className="px-4 py-2 text-left font-semibold">Amount</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Collateral</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_REPORT_DATA.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-brown/10 dark:border-cream/10 hover:bg-brown/5 dark:hover:bg-cream/5 transition-colors"
                  >
                    <td className="px-4 py-2">{row.id}</td>
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2">{row.type}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.borrower}</td>
                    <td className="px-4 py-2">{row.amount}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          'inline-block px-2 py-0.5 rounded-full text-xs font-medium ' +
                          (row.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : row.status === 'Repaid'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300')
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{row.collateral}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

        {/* ----------------------------------------------------------------- */}
        {/* Error Logs card                                                     */}
        {/* ----------------------------------------------------------------- */}
        <Card
          header={
            <h2 className="text-xl font-semibold text-brown dark:text-cream">Error Logs</h2>
          }
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
