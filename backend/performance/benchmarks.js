const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

// ── Baselines (p99 ms) — kept in sync with performance/BASELINES.md ──────────
const BASELINES = {
  'GET /api/v1/loans': 50,
  'GET /api/v1/collateral': 50,
  'POST /api/v1/loans': 100,
};

// Regression threshold: build fails if p99 exceeds baseline by more than 20%
const REGRESSION_PERCENT = 0.20;

// Performance test configuration
const TEST_CONFIG = {
  connections: 50,
  duration: 30,
  pipelining: 1,
};

// ── Minimal stub server (no DB / RPC needed for load testing) ─────────────────
function createStubServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/v1/loans', (_req, res) => {
    res.json({ data: [], total: 0, page: 1, pageSize: 20 });
  });

  app.get('/api/v1/collateral', (_req, res) => {
    res.json({ data: [], total: 0, page: 1, pageSize: 20 });
  });

  app.post('/api/v1/loans', (req, res) => {
    const body = req.body || {};
    res.status(201).json({ id: 1, borrower: body.borrower ?? null, amount: body.amount ?? 0 });
  });

  return app.listen(0);
}

// ── Run a single autocannon benchmark ─────────────────────────────────────────
function runBench(url, method, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      url,
      method,
      connections: TEST_CONFIG.connections,
      duration: TEST_CONFIG.duration,
      pipelining: TEST_CONFIG.pipelining,
      ...(body && {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    };
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// ── Generate GitHub Actions step summary ──────────────────────────────────────
function writeStepSummary(results) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  let md = '## 📊 Benchmark Comparison Results\n\n';
  md += '| Endpoint | p99 (ms) | Baseline (ms) | Δ Change | Threshold (+20%) | Status |\n';
  md += '|----------|----------|---------------|----------|-------------------|--------|\n';

  for (const r of results) {
    if (r.error) {
      md += `| ${r.label} | — | — | — | — | ❌ ERROR |\n`;
    } else {
      const pctChange = ((r.p99 - r.baseline) / r.baseline * 100).toFixed(1);
      const sign = r.p99 >= r.baseline ? '+' : '';
      const status = r.passed ? '✅ Pass' : '❌ Fail';
      md += `| ${r.label} | ${r.p99} | ${r.baseline} | ${sign}${pctChange}% | ${r.limit} | ${status} |\n`;
    }
  }

  md += '\n**Configuration:** 50 concurrent connections × 30s per endpoint\n';
  md += `**Regression threshold:** p99 must not exceed baseline by more than ${REGRESSION_PERCENT * 100}%\n`;

  fs.appendFileSync(summaryFile, md);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const useExternalServer = !!process.env.API_URL;
  let server;
  let base;

  if (useExternalServer) {
    base = process.env.API_URL;
    console.log(`Using external server: ${base}`);
  } else {
    server = createStubServer();
    const { port } = server.address();
    base = `http://localhost:${port}`;
    console.log(`Stub benchmark server on :${port}`);
  }

  console.log(`${TEST_CONFIG.connections} connections × ${TEST_CONFIG.duration}s per endpoint\n`);

  const endpoints = [
    { label: 'GET /api/v1/loans', url: `${base}/api/v1/loans`, method: 'GET' },
    { label: 'GET /api/v1/collateral', url: `${base}/api/v1/collateral`, method: 'GET' },
    {
      label: 'POST /api/v1/loans',
      url: `${base}/api/v1/loans`,
      method: 'POST',
      body: { borrower: 'G'.repeat(56), collateral_ids: [1], amount: 1000 },
    },
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

    const pctChange = ((p99 - baseline) / baseline * 100).toFixed(1);
    console.log(
      `p99=${p99}ms  baseline=${baseline}ms  limit=${limit}ms  (${p99 >= baseline ? '+' : ''}${pctChange}%)  ${passed ? '✓' : '✗ FAIL'}`
    );

    results.push({
      label: ep.label,
      p99,
      p95: r.latency.p97_5,
      p90: r.latency.p90,
      p50: r.latency.p50,
      mean: r.latency.mean,
      max: r.latency.max,
      baseline,
      limit,
      passed,
      rps: Math.round(r.requests.average),
      errors: r.errors,
      timeouts: r.timeouts,
    });
  }

  if (server) server.close();

  // Write results JSON
  const out = path.join(__dirname, '..', 'benchmark-results.json');
  fs.writeFileSync(out, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nResults → ${out}`);

  // Write GitHub Actions step summary
  writeStepSummary(results);

  // Summary
  console.log(`\nOverall: ${allPassed ? '✓ All benchmarks within threshold' : '✗ REGRESSION DETECTED'}`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
