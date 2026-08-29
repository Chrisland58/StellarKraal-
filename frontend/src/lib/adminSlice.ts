/**
 * adminSlice — state management for the admin panel.
 * Provides async thunks and a useReducer-based hook for
 * users, moderation queue, and platform statistics.
 */
import { useReducer, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  borrower: string;
}

export interface ModerationItem {
  id: string;
  borrower: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface AdminStatistics {
  totalLoans: number;
  totalAmount: number;
  byStatus: Record<string, number>;
}

interface SliceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AdminState {
  users: SliceState<AdminUser[]>;
  moderationQueue: SliceState<ModerationItem[]>;
  statistics: SliceState<AdminStatistics>;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialSlice = <T>(): SliceState<T> => ({ data: null, loading: false, error: null });

export const initialAdminState: AdminState = {
  users: initialSlice(),
  moderationQueue: initialSlice(),
  statistics: initialSlice(),
};

// ── Actions ───────────────────────────────────────────────────────────────────

type AdminAction =
  | { type: "users/pending" }
  | { type: "users/fulfilled"; payload: AdminUser[] }
  | { type: "users/rejected"; payload: string }
  | { type: "moderationQueue/pending" }
  | { type: "moderationQueue/fulfilled"; payload: ModerationItem[] }
  | { type: "moderationQueue/rejected"; payload: string }
  | { type: "statistics/pending" }
  | { type: "statistics/fulfilled"; payload: AdminStatistics }
  | { type: "statistics/rejected"; payload: string };

// ── Reducer ───────────────────────────────────────────────────────────────────

export function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case "users/pending":
      return { ...state, users: { data: null, loading: true, error: null } };
    case "users/fulfilled":
      return { ...state, users: { data: action.payload, loading: false, error: null } };
    case "users/rejected":
      return { ...state, users: { data: null, loading: false, error: action.payload } };

    case "moderationQueue/pending":
      return { ...state, moderationQueue: { data: null, loading: true, error: null } };
    case "moderationQueue/fulfilled":
      return { ...state, moderationQueue: { data: action.payload, loading: false, error: null } };
    case "moderationQueue/rejected":
      return { ...state, moderationQueue: { data: null, loading: false, error: action.payload } };

    case "statistics/pending":
      return { ...state, statistics: { data: null, loading: true, error: null } };
    case "statistics/fulfilled":
      return { ...state, statistics: { data: action.payload, loading: false, error: null } };
    case "statistics/rejected":
      return { ...state, statistics: { data: null, loading: false, error: action.payload } };

    default:
      return state;
  }
}

// ── Async thunks ──────────────────────────────────────────────────────────────

type Dispatch = React.Dispatch<AdminAction>;

export async function fetchUsers(dispatch: Dispatch): Promise<void> {
  dispatch({ type: "users/pending" });
  try {
    const res = await fetch(`${API}/api/v1/admin/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    dispatch({ type: "users/fulfilled", payload: json.data });
  } catch (err: unknown) {
    dispatch({ type: "users/rejected", payload: err instanceof Error ? err.message : "Failed to fetch users" });
  }
}

export async function fetchModerationQueue(dispatch: Dispatch): Promise<void> {
  dispatch({ type: "moderationQueue/pending" });
  try {
    const res = await fetch(`${API}/api/v1/admin/moderation-queue`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    dispatch({ type: "moderationQueue/fulfilled", payload: json.data });
  } catch (err: unknown) {
    dispatch({ type: "moderationQueue/rejected", payload: err instanceof Error ? err.message : "Failed to fetch moderation queue" });
  }
}

export async function fetchStatistics(dispatch: Dispatch): Promise<void> {
  dispatch({ type: "statistics/pending" });
  try {
    const res = await fetch(`${API}/api/v1/admin/statistics`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    dispatch({ type: "statistics/fulfilled", payload: json });
  } catch (err: unknown) {
    dispatch({ type: "statistics/rejected", payload: err instanceof Error ? err.message : "Failed to fetch statistics" });
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdminSlice() {
  const [state, dispatch] = useReducer(adminReducer, initialAdminState);

  const loadUsers = useCallback(() => fetchUsers(dispatch), []);
  const loadModerationQueue = useCallback(() => fetchModerationQueue(dispatch), []);
  const loadStatistics = useCallback(() => fetchStatistics(dispatch), []);

  return { state, loadUsers, loadModerationQueue, loadStatistics };
}
