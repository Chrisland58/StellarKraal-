import request from 'supertest';
import express from 'express';
import { TransactionBuilder, Networks, Account, Keypair, Contract } from '@stellar/stellar-sdk';
import rpcClient from '../utils/rpcClient';
import { pool } from '../utils/connectionPool';
import { runMigrations } from '../db/migrationRunner';
import { insertLoan } from '../db/store';
import { config } from '../config';

const app = express();
app.use(express.json());
// Normally v1Router is imported from v1.ts but v1.ts exports it as a default, wait... I should check v1.ts export.
// I will just read v1.ts to see what it exports. Let's mock the test first, then fix imports.
import { v1Router } from './v1';
app.use('/api/v1', v1Router);

jest.mock('@stellar/stellar-sdk', () => {
  return {
    TransactionBuilder: {
      fromXDR: (xdr: string) => {
        if (xdr === 'invalid_xdr_string') {
          throw new Error('Invalid XDR');
        }
        if (xdr === 'empty_ops_xdr') {
          return { operations: [] };
        }
        return { operations: [{ type: 'invokeHostFunction' }] };
      }
    },
    Networks: { TESTNET: 'testnet', PUBLIC: 'public' },
    Account: jest.fn(),
    Keypair: jest.fn(),
    Contract: jest.fn(),
    SorobanRpc: { Server: jest.fn() }
  };
});

jest.mock('../utils/rpcClient', () => ({
  __esModule: true,
  default: {
    sendTransaction: jest.fn(),
    getTransaction: jest.fn(),
  },
  sendTransaction: jest.fn(),
  getTransaction: jest.fn(),
}));

describe('POST /api/v1/loans/:id/repay XDR submission', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    pool.close();
  });

  it('accepts signed XDR and submits it to RPC', async () => {
    const loan = await insertLoan({
      id: 'loan-test-1',
      borrower: 'GBZ2...',
      collateral_id: '1',
      amount: 1000,
      status: 'active',
    });

    const signedXdr = 'valid_xdr_string';

    // @ts-ignore
    rpcClient.sendTransaction.mockResolvedValue({
      hash: 'mock_tx_hash',
      status: 'PENDING'
    });

    const response = await request(app)
      .post(`/api/v1/loans/${loan.id}/repay`)
      .send({ signedXdr })
      .expect(200);

    expect(response.body).toEqual({
      api_version: 'v1',
      hash: 'mock_tx_hash',
      status: 'PENDING'
    });
    expect(rpcClient.sendTransaction).toHaveBeenCalled();
  });

  it('rejects invalid XDR', async () => {
    const response = await request(app)
      .post('/api/v1/loans/1/repay')
      .send({ signedXdr: 'invalid_xdr_string' })
      .expect(400);

    expect(response.body.error).toBe('Invalid XDR structure');
  });
});
