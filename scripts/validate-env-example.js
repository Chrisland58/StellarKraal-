#!/usr/bin/env node
// Validates that:
//   1. Every variable declared in backend/src/config.ts has an entry in .env.example
//   2. Every variable declared in backend/src/config.ts is documented in
//      docs/guides/environment-variables.md
//
// Exits with code 1 if any variable is missing from either file.

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "backend", "src", "config.ts");
const examplePath = path.join(root, ".env.example");
const docsPath = path.join(root, "docs", "guides", "environment-variables.md");

const configSrc = fs.readFileSync(configPath, "utf8");
const exampleSrc = fs.readFileSync(examplePath, "utf8");
const docsSrc = fs.readFileSync(docsPath, "utf8");

// Extract variable names from z.object({ KEY: ... }) in config.ts
const keyRegex = /^\s{2}(\w+):/gm;
const configKeys = [];
let m;
while ((m = keyRegex.exec(configSrc)) !== null) {
  configKeys.push(m[1]);
}

// Extract keys present in .env.example (lines starting with KEY= or #KEY=)
const exampleKeys = new Set(
  exampleSrc
    .split("\n")
    .map((l) => l.replace(/^#\s*/, "").match(/^([A-Z_][A-Z0-9_]*)=/))
    .filter(Boolean)
    .map((m) => m[1])
);

// Extract keys mentioned in the docs (look for backtick-quoted uppercase variable names)
const docKeyRegex = /`([A-Z_][A-Z0-9_]*)`/g;
const docKeys = new Set();
let d;
while ((d = docKeyRegex.exec(docsSrc)) !== null) {
  docKeys.add(d[1]);
}

let hasError = false;

// Check 1: every config key must be in .env.example
const missingFromExample = configKeys.filter((k) => !exampleKeys.has(k));
if (missingFromExample.length > 0) {
  console.error("❌ .env.example is missing variables defined in config.ts:");
  missingFromExample.forEach((k) => console.error(`  - ${k}`));
  hasError = true;
}

// Check 2: every config key must appear in the docs
const missingFromDocs = configKeys.filter((k) => !docKeys.has(k));
if (missingFromDocs.length > 0) {
  console.error(
    "\n❌ docs/guides/environment-variables.md is missing variables defined in config.ts:"
  );
  missingFromDocs.forEach((k) => console.error(`  - ${k}`));
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

console.log(
  `✅ .env.example and environment-variables.md cover all ${configKeys.length} config variables.`
);
