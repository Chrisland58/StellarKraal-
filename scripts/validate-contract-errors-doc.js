#!/usr/bin/env node
// Validates that:
//   1. Every error variant in contracts/stellarkraal/src/lib.rs Error enum is documented in docs/api-error-codes.md
//   2. Every contract error code is mapped in backend/src/utils/sorobanErrors.ts
//
// Exits with code 1 if any error code is missing.

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "contracts", "stellarkraal", "src", "lib.rs");
const docsPath = path.join(root, "docs", "api-error-codes.md");
const backendPath = path.join(root, "backend", "src", "utils", "sorobanErrors.ts");

const contractSrc = fs.readFileSync(contractPath, "utf8");
const docsSrc = fs.readFileSync(docsPath, "utf8");
const backendSrc = fs.readFileSync(backendPath, "utf8");

const enumMatch = contractSrc.match(/pub enum Error\s*\{([\s\S]*?)\}/);
if (!enumMatch) {
  console.error("❌ Could not find pub enum Error definition in contracts/stellarkraal/src/lib.rs");
  process.exit(1);
}

const lines = enumMatch[1].split("\n");
const variants = [];
for (const line of lines) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(\d+)/);
  if (m) {
    variants.push({ name: m[1], code: parseInt(m[2], 10) });
  }
}

let hasError = false;

// Check 1: docs/api-error-codes.md
for (const { name, code } of variants) {
  if (!docsSrc.includes(`\`${name}\``) || !docsSrc.includes(`\`#${code}\``)) {
    console.error(`❌ docs/api-error-codes.md is missing documentation for: ${name} (#${code})`);
    hasError = true;
  }
}

// Check 2: backend/src/utils/sorobanErrors.ts
for (const { name, code } of variants) {
  const mappingPattern = new RegExp(`\\b${code}:\\s*`);
  if (!mappingPattern.test(backendSrc)) {
    console.error(`❌ backend/src/utils/sorobanErrors.ts is missing mapping for code: #${code} (${name})`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log(
  `✅ All ${variants.length} contract error variants in contracts/stellarkraal/src/lib.rs are documented in docs/api-error-codes.md and mapped in backend/src/utils/sorobanErrors.ts.`
);
