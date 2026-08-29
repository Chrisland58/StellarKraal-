import {
  adminReducer,
  initialAdminState,
  fetchUsers,
  fetchModerationQueue,
  fetchStatistics,
  type AdminState,
} from "@/lib/adminSlice";

// ── Reducer tests ─────────────────────────────────────────────────────────────

describe("adminReducer — users", () => {
  it("sets loading on pending", () => {
    const state = adminReducer(initialAdminState, { type: "users/pending" });
    expect(state.users.loading).toBe(true);
    expect(state.users.error).toBeNull();
  });

  it("stores data on fulfilled", () => {
    const payload = [{ borrower: "GABC" }];
    const state = adminReducer(initialAdminState, { type: "users/fulfilled", payload });
    expect(state.users.data).toEqual(payload);
    expect(state.users.loading).toBe(false);
  });

  it("stores error on rejected", () => {
    const state = adminReducer(initialAdminState, { type: "users/rejected", payload: "err" });
    expect(state.users.error).toBe("err");
    expect(state.users.loading).toBe(false);
  });
});

describe("adminReducer — moderationQueue", () => {
  it("sets loading on pending", () => {
    const state = adminReducer(initialAdminState, { type: "moderationQueue/pending" });
    expect(state.moderationQueue.loading).toBe(true);
  });

  it("stores data on fulfilled", () => {
    const payload = [{ id: "1", borrower: "G1", amount: 100, status: "pending", createdAt: "" }];
    const state = adminReducer(initialAdminState, { type: "moderationQueue/fulfilled", payload });
    expect(state.moderationQueue.data).toEqual(payload);
  });

  it("stores error on rejected", () => {
    const state = adminReducer(initialAdminState, { type: "moderationQueue/rejected", payload: "fail" });
    expect(state.moderationQueue.error).toBe("fail");
  });
});

describe("adminReducer — statistics", () => {
  it("sets loading on pending", () => {
    const state = adminReducer(initialAdminState, { type: "statistics/pending" });
    expect(state.statistics.loading).toBe(true);
  });

  it("stores data on fulfilled", () => {
    const payload = { totalLoans: 5, totalAmount: 500, byStatus: { active: 3, repaid: 2 } };
    const state = adminReducer(initialAdminState, { type: "statistics/fulfilled", payload });
    expect(state.statistics.data).toEqual(payload);
  });

  it("stores error on rejected", () => {
    const state = adminReducer(initialAdminState, { type: "statistics/rejected", payload: "oops" });
    expect(state.statistics.error).toBe("oops");
  });
});

// ── Thunk tests ───────────────────────────────────────────────────────────────

describe("fetchUsers thunk", () => {
  it("dispatches fulfilled with user data on success", async () => {
    const dispatched: unknown[] = [];
    const dispatch = (a: unknown) => { dispatched.push(a); };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ borrower: "GABC" }] }),
    } as Response);

    await fetchUsers(dispatch as any);

    expect(dispatched[0]).toEqual({ type: "users/pending" });
    expect(dispatched[1]).toEqual({ type: "users/fulfilled", payload: [{ borrower: "GABC" }] });
  });

  it("dispatches rejected on HTTP error", async () => {
    const dispatched: unknown[] = [];
    const dispatch = (a: unknown) => { dispatched.push(a); };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await fetchUsers(dispatch as any);

    expect((dispatched[1] as any).type).toBe("users/rejected");
  });
});

describe("fetchModerationQueue thunk", () => {
  it("dispatches fulfilled with queue data on success", async () => {
    const dispatched: unknown[] = [];
    const dispatch = (a: unknown) => { dispatched.push(a); };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    await fetchModerationQueue(dispatch as any);

    expect(dispatched[0]).toEqual({ type: "moderationQueue/pending" });
    expect(dispatched[1]).toEqual({ type: "moderationQueue/fulfilled", payload: [] });
  });
});

describe("fetchStatistics thunk", () => {
  it("dispatches fulfilled with stats on success", async () => {
    const dispatched: unknown[] = [];
    const dispatch = (a: unknown) => { dispatched.push(a); };
    const stats = { totalLoans: 10, totalAmount: 1000, byStatus: {} };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => stats,
    } as Response);

    await fetchStatistics(dispatch as any);

    expect(dispatched[1]).toEqual({ type: "statistics/fulfilled", payload: stats });
  });

  it("dispatches rejected on fetch failure", async () => {
    const dispatched: unknown[] = [];
    const dispatch = (a: unknown) => { dispatched.push(a); };
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    await fetchStatistics(dispatch as any);

    expect((dispatched[1] as any).type).toBe("statistics/rejected");
    expect((dispatched[1] as any).payload).toBe("Network error");
  });
});
