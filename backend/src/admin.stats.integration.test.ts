/**
 * Integration tests for GET /api/v1/admin/stats (issue #843).
 * Covers: admin access, non-admin 403, stats aggregation, caching.
 */
import request from "supertest";
import app from "./index";
import { insertCollateral, insertLoan } from "./db/store";

jest.mock("./utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  })),
}));

jest.mock("@stellar/stellar-sdk", () => {
  const actual = jest.requireActual("@stellar/stellar-sdk");
  return {
    ...actual,
    Networks: { TESTNET: "Test SDF Network ; September 2015", PUBLIC: "Public Global Stellar Network ; September 2015" },
    BASE_FEE: "100",
    Contract: jest.fn().mockImplementation(() => ({ call: jest.fn().mockReturnValue({}) })),
    TransactionBuilder: jest.fn().mockImplementation(() => ({
      addOperation: jest.fn().mockReturnThis(),
      setTimeout: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({ toXDR: () => "mock_xdr" }),
    })),
    Address: jest.fn().mockImplementation(() => ({ toScVal: jest.fn().mockReturnValue({}) })),
    nativeToScVal: jest.fn().mockReturnValue({}),
    SorobanRpc: {
      Server: jest.fn().mockImplementation(() => ({
        getAccount: jest.fn().mockResolvedValue({ id: "GABC", sequence: "1" }),
        prepareTransaction: jest.fn().mockResolvedValue({ toXDR: () => "prepared_xdr" }),
        simulateTransaction: jest.fn().mockResolvedValue({ result: { retval: {} } }),
        getHealth: jest.fn().mockResolvedValue({ status: "healthy" }),
      })),
    },
  };
});

const ADMIN_KEY = "GBGBE57DSWNBO73HMKLGPCNUR7V4T3WYCXU34AHVZAR3FFFOSVZLEABQ";
const USER_KEY = "GBUQWP3BOUZX34ULNQG23RQ6F4BWFIREBAOPHTEABF5KJSTLTOKNXYHM";

let testUser: any = { publicKey: ADMIN_KEY, role: "admin" };

jest.mock("./middleware/auth", () => ({
  authRouter: require("express").Router(),
  jwtMiddleware: (req: any, _res: any, next: any) => {
    req.user = testUser;
    next();
  },
}));

describe("GET /api/v1/admin/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testUser = { publicKey: ADMIN_KEY, role: "admin" };
  });

  describe("authentication", () => {
    it("returns 403 if user is not authenticated", async () => {
      testUser = undefined;
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(403);
      expect(res.body.error).toContain("admin role required");
    });

    it("returns 403 if user is authenticated but not admin", async () => {
      testUser = { publicKey: USER_KEY, role: "user" };
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(403);
      expect(res.body.error).toContain("admin role required");
    });

    it("returns 403 if user has no role", async () => {
      testUser = { publicKey: USER_KEY };
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(403);
      expect(res.body.error).toContain("admin role required");
    });
  });

  describe("stats aggregation", () => {
    it("returns correct stats for empty database", async () => {
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalUsers: 0,
        totalLoans: 0,
        totalCollateral: 0,
        totalValueLocked: 0,
        activeLoansCount: 0,
      });
    });

    it("returns correct totalCollateral count", async () => {
      insertCollateral({
        id: "col-1",
        owner: "GAAA",
        animal_type: "cattle",
        count: 2,
        appraised_value: 50_000_000,
        status: "available",
      });
      insertCollateral({
        id: "col-2",
        owner: "GBBB",
        animal_type: "goat",
        count: 5,
        appraised_value: 25_000_000,
        status: "available",
      });

      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body.totalCollateral).toBe(2);
    });

    it("returns correct totalLoans count", async () => {
      insertLoan({
        id: "loan-1",
        borrower: "GAAA",
        collateral_id: "col-1",
        amount: 100_000_000,
        status: "active",
      });
      insertLoan({
        id: "loan-2",
        borrower: "GBBB",
        collateral_id: "col-2",
        amount: 50_000_000,
        status: "active",
      });
      insertLoan({
        id: "loan-3",
        borrower: "GCCC",
        collateral_id: "col-3",
        amount: 75_000_000,
        status: "repaid",
      });

      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body.totalLoans).toBe(3);
    });

    it("returns correct activeLoansCount", async () => {
      insertLoan({
        id: "loan-1",
        borrower: "GAAA",
        collateral_id: "col-1",
        amount: 100_000_000,
        status: "active",
      });
      insertLoan({
        id: "loan-2",
        borrower: "GBBB",
        collateral_id: "col-2",
        amount: 50_000_000,
        status: "at_risk",
      });
      insertLoan({
        id: "loan-3",
        borrower: "GCCC",
        collateral_id: "col-3",
        amount: 75_000_000,
        status: "repaid",
      });

      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body.activeLoansCount).toBe(2);
    });

    it("returns correct totalValueLocked in XLM", async () => {
      insertCollateral({
        id: "col-1",
        owner: "GAAA",
        animal_type: "cattle",
        count: 2,
        appraised_value: 100_000_000, // 10 XLM
        status: "available",
      });
      insertCollateral({
        id: "col-2",
        owner: "GBBB",
        animal_type: "goat",
        count: 5,
        appraised_value: 50_000_000, // 5 XLM
        status: "available",
      });

      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body.totalValueLocked).toBe(15);
    });

    it("returns correct totalUsers (unique users)", async () => {
      insertCollateral({
        id: "col-1",
        owner: "GAAA",
        animal_type: "cattle",
        count: 2,
        appraised_value: 50_000_000,
        status: "available",
      });
      insertCollateral({
        id: "col-2",
        owner: "GBBB",
        animal_type: "goat",
        count: 5,
        appraised_value: 25_000_000,
        status: "available",
      });
      insertLoan({
        id: "loan-1",
        borrower: "GAAA", // Same as owner of col-1
        collateral_id: "col-1",
        amount: 100_000_000,
        status: "active",
      });
      insertLoan({
        id: "loan-2",
        borrower: "GCCC", // New user
        collateral_id: "col-2",
        amount: 50_000_000,
        status: "active",
      });

      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      // GAAA (collateral owner + borrower), GBBB (collateral owner), GCCC (borrower)
      expect(res.body.totalUsers).toBe(3);
    });
  });

  describe("caching", () => {
    it("returns cached response on second request", async () => {
      insertCollateral({
        id: "col-1",
        owner: "GAAA",
        animal_type: "cattle",
        count: 2,
        appraised_value: 50_000_000,
        status: "available",
      });

      // First request
      const res1 = await request(app).get("/api/v1/admin/stats");
      expect(res1.status).toBe(200);
      const body1 = res1.body;

      // Add another collateral (but cache is active)
      insertCollateral({
        id: "col-2",
        owner: "GBBB",
        animal_type: "goat",
        count: 5,
        appraised_value: 25_000_000,
        status: "available",
      });

      // Second request (should return cached data)
      const res2 = await request(app).get("/api/v1/admin/stats");
      expect(res2.status).toBe(200);
      expect(res2.body).toEqual(body1);
      expect(res2.body.totalCollateral).toBe(1); // Cached value
    });
  });

  describe("response format", () => {
    it("returns all required fields", async () => {
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalLoans");
      expect(res.body).toHaveProperty("totalCollateral");
      expect(res.body).toHaveProperty("totalValueLocked");
      expect(res.body).toHaveProperty("activeLoansCount");
    });

    it("returns numeric values for all stats", async () => {
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(200);
      expect(typeof res.body.totalUsers).toBe("number");
      expect(typeof res.body.totalLoans).toBe("number");
      expect(typeof res.body.totalCollateral).toBe("number");
      expect(typeof res.body.totalValueLocked).toBe("number");
      expect(typeof res.body.activeLoansCount).toBe("number");
    });
  });
});
