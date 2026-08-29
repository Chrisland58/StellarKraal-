# Database Migration Guide

## Overview
This guide explains how to write and manage database migrations in StellarKraal-.

## Migration Structure

### File Naming Convention
export async function up(knex: Knex): Promise<void> {
  // Create table
  await knex.schema.createTable('table_name', (table) => {
    // Column definitions
    table.uuid('id').primary();
    table.string('column_name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Or alter table
  await knex.schema.alterTable('table_name', (table) => {
    table.string('new_column').nullable();
  });

  // Or insert data
  await knex('table_name').insert([
    { id: 'uuid', name: 'example' }
  ]);
}
export async function down(knex: Knex): Promise<void> {
  // Drop table
  await knex.schema.dropTable('table_name');

  // Or revert alter
  await knex.schema.alterTable('table_name', (table) => {
    table.dropColumn('new_column');
  });

  // Or delete data
  await knex('table_name').where('id', 'uuid').delete();
}
// Add soft-delete columns
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('deleted_at').nullable();
    table.index('deleted_at');
  });
}

// Soft delete query
await knex('users')
  .where('id', userId)
  .update({ deleted_at: knex.fn.now() });

// Exclude soft-deleted records
await knex('users')
  .whereNull('deleted_at');

// Include soft-deleted records
await knex('users')
  .whereNotNull('deleted_at');

// Hard delete (permanent)
await knex('users')
  .where('id', userId)
  .delete();
// Create helper functions
const withSoftDelete = (query, includeDeleted = false) => {
  if (!includeDeleted) {
    return query.whereNull('deleted_at');
  }
  return query;
};

// Usage
await withSoftDelete(knex('users'))
  .select('*')
  .where('role', 'admin');
// __tests__/migrations/migration.test.ts

import { Knex } from 'knex';
import { up, down } from '../../migrations/20240101000000_create_users_table';

describe('Migration: create_users_table', () => {
  let knex: Knex;

  beforeAll(async () => {
    // Setup test database
    knex = require('knex')({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL
    });
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it('should create users table', async () => {
    await up(knex);
    
    const exists = await knex.schema.hasTable('users');
    expect(exists).toBe(true);
    
    const columns = await knex('users').columnInfo();
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('email');
    expect(columns).toHaveProperty('password_hash');
    expect(columns).toHaveProperty('full_name');
  });

  it('should drop users table', async () => {
    await down(knex);
    
    const exists = await knex.schema.hasTable('users');
    expect(exists).toBe(false);
  });
});
// __tests__/integration/migrations.test.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Migrations', () => {
  it('should run migrations successfully', async () => {
    const { stdout, stderr } = await execAsync(
      'NODE_ENV=test npx knex migrate:latest'
    );
    expect(stderr).toBe('');
    expect(stdout).toContain('Batch 1 run');
  });

  it('should rollback migrations successfully', async () => {
    const { stdout, stderr } = await execAsync(
      'NODE_ENV=test npx knex migrate:rollback'
    );
    expect(stderr).toBe('');
    expect(stdout).toContain('Rolled back');
  });
});
// migrations/YYYYMMDDHHMMSS_description.ts

import { Knex } from 'knex';

/**
 * Description of migration
 * 
 * Up: Creates table_name with columns
 * Down: Drops table_name
 */
export async function up(knex: Knex): Promise<void> {
  // Apply changes
}

export async function down(knex: Knex): Promise<void> {
  // Revert changes
}
// migrations/YYYYMMDDHHMMSS_create_table_name.ts

import { Knex } from 'knex';

/**
 * Create table_name table with soft-delete support
 * 
 * Up: Creates table_name table
 * Down: Drops table_name table
 */
export async function up(knex: Knex): Promise<void> {
  // Create table
  await knex.schema.createTable('table_name', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign keys
    table.uuid('user_id').references('id').inTable('users');
    
    // Columns
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('metadata').defaultTo('{}');
    table.enum('status', ['active', 'inactive', 'pending'])
      .defaultTo('pending');
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Soft-delete
    table.timestamp('deleted_at').nullable();
    
    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('deleted_at');
  });

  // Add triggers for updated_at
  await knex.raw(`
    CREATE TRIGGER update_table_name_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger
  await knex.raw('DROP TRIGGER IF EXISTS update_table_name_updated_at ON table_name');
  
  // Drop table
  await knex.schema.dropTable('table_name');
}
# Force unlock migration lock
knex migrate:unlock

# Check for unfinished migrations
knex migrate:status
# Rollback specific batch
knex migrate:rollback --batch=1

# Rollback all migrations
knex migrate:rollback --all
git add .
