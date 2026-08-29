# Database Connection Pool Configuration

## Overview
StellarKraal- uses a connection pool to manage database connections efficiently. This guide explains the configuration options, behavior, and best practices.

## Architecture

{
  min: 3,
  max: 10,
  acquireTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  retryAttempts: 3,
  retryDelayMillis: 1000
}
{
  min: 5,
  max: 20,
  acquireTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
  retryAttempts: 5,
  retryDelayMillis: 1000,
  retryBackoff: true
}
// Increase max connections
{
  max: 30 // Instead of default 10
}
// Increase acquire timeout
{
  acquireTimeoutMillis: 60000 // Instead of 30000
}
// Use pagination to reduce query time
const results = await db('users')
  .select('*')
  .limit(100)
  .offset(0);
// Log pool status
const poolStatus = {
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
};
console.log('Pool status:', poolStatus);
import { CircuitBreaker } from 'opossum';

const breaker = new CircuitBreaker(async () => {
  return await db('users').select('*');
}, {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

// Use circuit breaker
try {
  const result = await breaker.fire();
} catch (error) {
  console.error('Circuit breaker opened:', error);
}
// src/config/database.ts

import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'stellar_kraal',
  
  // Pool settings
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000'),
  createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000'),
  destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
  
  // Retry settings
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
  retryDelayMillis: parseInt(process.env.DB_RETRY_DELAY || '1000'),
  retryBackoff: process.env.DB_RETRY_BACKOFF === 'true',
  
  // SSL
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

export const pool = new Pool(poolConfig);
// src/config/database.ts

pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('acquire', (client) => {
  console.log('Connection acquired from pool');
});

pool.on('remove', (client) => {
  console.log('Connection removed from pool');
});

pool.on('error', (err, client) => {
  console.error('Database pool error:', err);
});
// src/health/database.ts

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
# Database Connection Pool Environment Variables

# Pool Size
DB_POOL_MIN=2                    # Minimum connections in pool
DB_POOL_MAX=10                   # Maximum connections in pool

# Timeouts (milliseconds)
DB_IDLE_TIMEOUT=30000            # Close idle connections after 30s
DB_ACQUIRE_TIMEOUT=30000         # Wait up to 30s for connection
DB_CREATE_TIMEOUT=30000          # Wait up to 30s to create connection
DB_DESTROY_TIMEOUT=5000          # Wait up to 5s to destroy connection

# Retry Settings
DB_RETRY_ATTEMPTS=3              # Number of retry attempts
DB_RETRY_DELAY=1000              # Delay between retries (ms)
DB_RETRY_BACKOFF=true            # Use exponential backoff

# SSL
DB_SSL=false                     # Enable SSL connections
// src/metrics/pool.ts

import client from 'prom-client';

export const poolMetrics = {
  totalConnections: new client.Gauge({
    name: 'db_pool_total_connections',
    help: 'Total connections in pool'
  }),
  
  idleConnections: new client.Gauge({
    name: 'db_pool_idle_connections',
    help: 'Idle connections in pool'
  }),
  
  waitingRequests: new client.Gauge({
    name: 'db_pool_waiting_requests',
    help: 'Requests waiting for connection'
  }),
  
  poolExhaustionErrors: new client.Counter({
    name: 'db_pool_exhaustion_errors_total',
    help: 'Total pool exhaustion errors'
  })
};

// Update metrics periodically
setInterval(() => {
  poolMetrics.totalConnections.set(pool.totalCount);
  poolMetrics.idleConnections.set(pool.idleCount);
  poolMetrics.waitingRequests.set(pool.waitingCount);
}, 5000);
