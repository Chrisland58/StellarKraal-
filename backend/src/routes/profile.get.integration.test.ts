/**
 * Integration tests for GET /api/v1/profile.
 * Closes #845
 */
import { createHmac } from "crypto";
import request from "supertest";
import { Keypair } from "@stellar/stellar-sdk";
import app from "../index";
import { insertLoan, insertCollateral } from "../db/store";

jest.mock("../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  })),
}));

// Avoid jest.requireActual("@stellar/stellar-sdk") — a transitive @noble/hashes
// ESM build breaks under ts-jest's CJS transform. Define a self-contained mock
// with a crypto-based Keypair stand-in instead.
jest.mock("@stellar/stellar-sdk", () => {
  const { createHmac: hmac } = require("crypto") as typeof import("crypto");
  const registry = new Map<string, Buffer>();
  let counter = 0;
  class KP {
    constructor(private pub: string, private seed: Buffer) {}
    static random() {
      counter += 1;
      const seed = Buffer.from(`seed-${counter}-${Math.random()}`);
      const pub = `GPROFILETEST${String(counter).padStart(4, "0")}${"A".repeat(43)}`.slice(0, 56);
      registry.set(pub, seed);
      return new KP(pub, seed);
    }
    static fromPublicKey(pub: string) {
      const seed = registry.get(pub) ?? Buffer.alloc(32, pub);
      return new KP(pub, seed);
    }
    publicKey() { return this.pub; }
    sign(data: Buffer) { return hmac("sha512", this.seed).update(data).digest(); }
    verify(data: Buffer, sig: Buffer) { return hmac("sha512", this.seed).update(data).digest().equals(sig); }
  }
  const rpcModule = {
    Server: jest.fn().mockImplementation(() => ({
      getAccount: jest.fn().mockResolvedValue({ id: "GABC", sequence: "1" }),
      prepareTransaction: jest.fn().mockResolvedValue({ toXDR: () => "prepared_xdr" }),
      simulateTransaction: jest.fn().mockResolvedValue({ result: { retval: { value: 42 } } }),
      getHealth: jest.fn().mockResolvedValue({ status: "healthy" }),
    })),
  };
  return {
    Keypair: KP,
    StrKey: { isValidEd25519PublicKey: () => true },
    Networks: { TESTNET: "Test SDF Network ; September 2015", PUBLIC: "Public Global Stellar Network ; September 2015" },
    BASE_FEE: "100",
    Contract: jest.fn(() => ({ call: jest.fn().mockReturnValue({}) })),
    TransactionBuilder: jest.fn(() => ({
      addOperation: jest.fn().mockReturnThis(),
      setTimeout: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({ toXDR: () => "mock_xdr" }),
    })),
    Address: jest.fn(() => ({ toScVal: jest.fn().mockReturnValue({}) })),
    nativeToScVal: jest.fn().mockReturnValue({}),
    SorobanRpc: rpcModule,
    rpc: rpcModule,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getChallenge(): Promise<string> {
  const res = await request(app).get("/api/auth/challenge");
  expect(res.status).toBe(200);
  return res.body.challenge as string;
}

async function login(kp: any): Promise<{ accessToken: string; expiresIn: number }> {
  const challenge = await getChallenge();
  const res = await request(app).post("/api/auth/login").send({
    walletAddress: kp.publicKey(),
    signedChallenge: { nonce: challenge, signature: kp.sign(Buffer.from(challenge, "hex")).toString("hex") },
  });
  expect(res.status).toBe(200);
  return res.body;
}

const JWT_SECRET = "change-me-in-production-min-32-chars!!";
function b64url(buf: Buffer | string): string {
  const s = typeof buf === "string" ? Buffer.from(buf) : buf;
  return s.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function makeToken(payload: object, secret = JWT_SECRET): string {
  const h = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const b = b64url(JSON.stringify(payload));
  return `${h}.${b}.${b64url(createHmac("sha256", secret).update(`${h}.${b}`).digest())}`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/v1/profile", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/profile");
    expect(res.status).toBe(401);
  });

  it("auto-creates a profile on first login and returns it for a new user", async () => {
    const kp = (Keypair as any).random();
    const { accessToken } = await login(kp);

    const res = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.walletAddress).toBe(kp.publicKey());
    expect(typeof res.body.joinedAt).toBe("string");
    expect(res.body.loanCount).toBe(0);
    expect(res.body.collateralCount).toBe(0);
  });

  it("reflects loan and collateral counts for an existing user", async () => {
    const kp = (Keypair as any).random();
    const { accessToken } = await login(kp);
    const wallet = kp.publicKey();

    insertCollateral({
      id: `col_${wallet}`,
      owner: wallet,
      animal_type: "cattle",
      count: 5,
      appraised_value: 1_000_000,
    });
    insertLoan({
      id: `loan_${wallet}`,
      borrower: wallet,
      collateral_id: `col_${wallet}`,
      amount: 500_000,
    });

    const res = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.loanCount).toBe(1);
    expect(res.body.collateralCount).toBe(1);
  });

  it("returns 404 for an authenticated wallet that has never logged in (no profile record)", async () => {
    const kp = (Keypair as any).random();
    // Forge a valid token without ever calling POST /api/auth/login, so no
    // profile auto-creation has happened for this wallet.
    const token = makeToken({
      sub: kp.publicKey(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    const res = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
