/**
 * Stellar Horizon API client for fallback account queries.
 *
 * Used as a fallback when Soroban RPC is unavailable for read-only operations
 * like fetching account balance information.
 */
import { config } from '../config';
import logger from './logger';
import { getCorrelationId } from './correlationContext';

/**
 * Fetch account information from Horizon API.
 * Returns balance and other basic account details.
 *
 * @param address - Stellar account address (starts with 'G')
 * @returns Account object with balance information
 * @throws Error if Horizon URL is not configured or if the request fails
 */
export async function getAccountFromHorizon(address: string): Promise<any> {
  const horizonUrl = config.HORIZON_URL;
  if (!horizonUrl) {
    throw new Error('HORIZON_URL is not configured');
  }

  const correlationId = getCorrelationId();
  const url = `${horizonUrl}/accounts/${encodeURIComponent(address)}`;

  try {
    logger.debug('Fetching account from Horizon', {
      address,
      correlationId,
      horizonUrl,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId ?? '',
      },
    });

    if (!response.ok) {
      throw new Error(`Horizon responded with status ${response.status}`);
    }

    const account = await response.json();

    logger.debug('Successfully fetched account from Horizon', {
      address,
      correlationId,
      balance: account.balances?.[0]?.balance,
    });

    return account;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to fetch account from Horizon', {
      address,
      correlationId,
      error: errorMsg,
    });
    throw error;
  }
}

/**
 * Check if Horizon is configured and available.
 * @returns True if HORIZON_URL is configured, false otherwise.
 */
export function isHorizonConfigured(): boolean {
  return !!config.HORIZON_URL;
}
