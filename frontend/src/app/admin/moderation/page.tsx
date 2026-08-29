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
 * Admin moderation page — #802
 * Tables use zebra striping + hover highlight via AdminTable / AdminTableRow.
 */

const FLAGGED_COLUMNS = ['Item', 'Type', 'Flagged By', 'Reported At', 'Actions'];
const QUEUE_COLUMNS = ['Request', 'Submitted By', 'Submitted At', 'Priority'];
const RECENT_ACTIONS_COLUMNS = ['Action', 'Target', 'Moderator', 'Timestamp'];

interface FlaggedItem {
  id: string;
  item: string;
  type: string;
  flaggedBy: string;
  reportedAt: string;
}

interface QueueItem {
  id: string;
  request: string;
  submittedBy: string;
  submittedAt: string;
  priority: string;
}

interface RecentAction {
  id: string;
  action: string;
  target: string;
  moderator: string;
  timestamp: string;
}

const DEMO_FLAGGED: FlaggedItem[] = [];
const DEMO_QUEUE: QueueItem[] = [];
const DEMO_RECENT_ACTIONS: RecentAction[] = [];

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-sm text-brown/60 dark:text-cream/60"
      >
        {message}
      </td>
    </tr>
  );
}

export default function ModerationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const pageData = useMemo(
    () => ({
      pageName: 'Moderation',
      routePath: 'moderation',
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
            <h2 className="text-xl font-semibold text-brown dark:text-cream">Flagged Content</h2>
          }
        >
          <AdminTable columns={FLAGGED_COLUMNS} caption="Flagged content table">
            {DEMO_FLAGGED.length === 0 ? (
              <EmptyRow
                colSpan={FLAGGED_COLUMNS.length}
                message="No flagged content to moderate at this time."
              />
            ) : (
              DEMO_FLAGGED.map((item, index) => (
                <AdminTableRow key={item.id} index={index}>
                  <AdminTableCell>{item.item}</AdminTableCell>
                  <AdminTableCell>{item.type}</AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">{item.flaggedBy}</AdminTableCell>
                  <AdminTableCell>{item.reportedAt}</AdminTableCell>
                  <AdminTableCell>
                    <button className="text-sm text-gold-600 hover:underline">Review</button>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </Card>

        <Card
          header={
            <h2 className="text-xl font-semibold text-brown dark:text-cream">Moderation Queue</h2>
          }
        >
          <AdminTable columns={QUEUE_COLUMNS} caption="Moderation queue table">
            {DEMO_QUEUE.length === 0 ? (
              <EmptyRow
                colSpan={QUEUE_COLUMNS.length}
                message="Queue is empty."
              />
            ) : (
              DEMO_QUEUE.map((item, index) => (
                <AdminTableRow key={item.id} index={index}>
                  <AdminTableCell>{item.request}</AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">{item.submittedBy}</AdminTableCell>
                  <AdminTableCell>{item.submittedAt}</AdminTableCell>
                  <AdminTableCell>{item.priority}</AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </Card>

        <Card
          header={
            <h2 className="text-xl font-semibold text-brown dark:text-cream">Recent Actions</h2>
          }
        >
          <AdminTable columns={RECENT_ACTIONS_COLUMNS} caption="Recent moderation actions table">
            {DEMO_RECENT_ACTIONS.length === 0 ? (
              <EmptyRow
                colSpan={RECENT_ACTIONS_COLUMNS.length}
                message="No recent moderation actions."
              />
            ) : (
              DEMO_RECENT_ACTIONS.map((action, index) => (
                <AdminTableRow key={action.id} index={index}>
                  <AdminTableCell>{action.action}</AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">{action.target}</AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">{action.moderator}</AdminTableCell>
                  <AdminTableCell>{action.timestamp}</AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </Card>
      </div>
    </AdminLayout>
  );
}
