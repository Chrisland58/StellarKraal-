# Soft Delete Pattern

## Overview

`collaterals` and `loans` use soft deletion instead of hard `DELETE` statements. A nullable `deleted_at` (integer, epoch millis) column marks a row as deleted without removing it from the table. This was introduced in the migration `backend/migrations/sqls/20260426000000-add-soft-delete-up.sql`.

## Why soft-delete

- **Audit trail**: collateral and loan records back a lending relationship on-chain; the off-chain rows must remain available for dispute resolution, regulatory/compliance review, and reconciliation against Soroban contract state even after a record is "removed".
- **Recoverability**: an accidental or premature delete (e.g. from an admin action or a bug) can be reversed by clearing `deleted_at` instead of restoring from a backup.
- **Referential safety**: loans reference collateral by ID; hard-deleting a collateral row while a loan still references it would break joins and historical reporting.

## When to use it

Apply soft-delete to any table representing a financial or collateral record that must remain auditable: currently `collaterals` and `loans`. Purely ephemeral or derived data (e.g. cached RPC responses, in-memory webhook delivery logs) does not need this pattern and can be hard-deleted or expired normally.

## How it works

- `deleted_at` is `NULL` for active rows and set to the deletion timestamp (epoch millis) when a record is soft-deleted.
- Indexes `idx_collaterals_deleted` and `idx_loans_deleted` exist on `deleted_at` to keep filtered queries efficient.
- **All read queries against `collaterals` and `loans` must filter `WHERE deleted_at IS NULL`** to exclude soft-deleted records from normal application behavior (listings, lookups, aggregates).
- "Deleting" a record means setting `deleted_at = <now>`, not issuing a `DELETE` statement.

## Rollback

The down migration (`20260426000000-add-soft-delete-down.sql`) drops the `deleted_at` columns and their indexes, which permanently discards soft-delete state — only run it if no soft-deleted rows need to be preserved.
