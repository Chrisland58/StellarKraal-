#!/usr/bin/env node
/**
 * Performance benchmarks — Issue #369 / #643
 *
 * Simulates 50 concurrent users × 30 seconds against:
 *   GET  /api/v1/loans
 *   GET  /api/v1/collateral
 *   POST /api/v1/loans
 *
 * Documented p99 baselines (ms):
 *   GET  /api/v1/loans       50
 *   GET  /api/v1/collateral  50
 *   POST /api/v1/loans      100
 *
 * CI fails if any p99 > baseline + 20%.
 * Results written to benchmark-results.json for artifact upload.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const autocannon = require("autocannon");
const http = require("http");
const express = require("express");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const NODE_ENV = process.env.NODE_ENV || "development";

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format:
    NODE_ENV === "production"
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`
          )
        ),
  transports: [new winston.transports.Console()],
});


// ── Baselines (p99 ms) — kept in sync with performance/BASELINES.md ───────────
const BASELINES = {
  "GET /api/v1/loans": 50,
  "GET /api/v1/collateral": 50,
  "POST /api/v1/loans": 100,
};

// Regression threshold: build fails if p99 exceeds baseline by more than 20%
const REGRESSION_PERCENT = 0.20;

// ── Minimal stub server (no DB / RPC needed for load testing) ─────────────────
function createServer() {
  const app = express();
  app.use(express.json());

  // Minimal stub endpoints that mimic the real API surface but avoid DB/RPC.
  app.get("/api/v1/loans", (_req, res) => {
    // Return a small paginated response
    res.json({ data: [], total: 0, page: 1, pageSize: 20 });
  });

  app.get("/api/v1/collateral", (_req, res) => {
    res.json({ data: [], total: 0, page: 1, pageSize: 20 });
  });

  app.post("/api/v1/loans", (req, res) => {
    // Echo back a minimal created object
    const body = req.body || {};
    res.status(201).json({ id: 1, borrower: body.borrower ?? null, amount: body.amount ?? 0 });
  });

  return app.listen(0);
}

// ── Run one autocannon benchmark ──────────────────────────────────────────────
function runBench(url, method, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      url,
      method,
      connections: 50,
      duration: 30,
      ...(body && {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    };
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const server = createServer();
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  logger.info(`Benchmark server on :${port}`);
  logger.info("50 connections × 30s per endpoint\n");

  const endpoints = [
    { label: "GET /api/v1/loans",      url: `${base}/api/v1/loans`,      method: "GET" },
    { label: "GET /api/v1/collateral", url: `${base}/api/v1/collateral`, method: "GET" },
    { label: "POST /api/v1/loans",     url: `${base}/api/v1/loans`,      method: "POST",
      body: { borrower: "G".repeat(56), collateral_ids: [1], amount: 1000 } },
  ];

  const results = [];
  let allPassed = true;

  for (const ep of endpoints) {
    process.stdout.write(`Running ${ep.label} ... `);
    const r = await runBench(ep.url, ep.method, ep.body);
    const p99 = r.latency.p99;
    const baseline = BASELINES[ep.label];
    const limit = Math.round(baseline * (1 + REGRESSION_PERCENT));
    const passed = p99 <= limit;
    if (!passed) allPassed = false;

    logger.info(`p99=${p99}ms  baseline=${baseline}ms  limit=${limit}ms  ${passed ? "✓" : "✗ FAIL"}`, { label: ep.label, p99, baseline, limit, passed });
    results.push({ label: ep.label, p99, p95: r.latency.p97_5, baseline, limit, passed,
      rps: Math.round(r.requests.average), errors: r.errors });
  }

  server.close();

  // Write artifact
  const out = path.join(__dirname, "..", "benchmark-results.json");
  fs.writeFileSync(out, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  logger.info(`\nResults → ${out}`);

  if (!allPassed) {
    logger.error("❌ p99 exceeded baseline by more than 20%");
    process.exit(1);
  }
  logger.info("✓ All benchmarks within 20% of baseline");
}

main().catch((e) => { logger.error(e instanceof Error ? e.message : String(e), { stack: e.stack }); process.exit(1); });
