/**
 * Collateral business logic — decoupled from HTTP layer for v1/v2 reuse.
 */
import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { stellarPublicKeySchema } from '../validators/stellar';
import { getCollateral } from '../db/store';
import { buildContractTx } from './contractTx';

/**
 * Zod schema that validates a single collateral registration payload.
 * Enforces that `owner` is a valid Stellar public key, `animal_type` is a
 * non-empty string, and `count` / `appraised_value` are positive integers.
 */
export const registerCollateralSchema = z.object({
  owner: stellarPublicKeySchema,
  animal_type: z.string().min(1),
  count: z.number().int().positive(),
  appraised_value: z.number().int().positive(),
});

/** Inferred TypeScript type for a validated single collateral registration payload. */
export type RegisterCollateralInput = z.infer<typeof registerCollateralSchema>;

/**
 * Zod schema that validates a batch collateral registration payload.
 * Enforces that `items` contains between 1 and 50 valid
 * {@link registerCollateralSchema} entries.
 */
export const batchRegisterCollateralSchema = z.object({
  items: z
    .array(registerCollateralSchema)
    .min(1, 'items must contain at least one entry')
    .max(50, 'items must not exceed 50 entries per batch'),
});

/** Inferred TypeScript type for a validated batch collateral registration payload. */
export type BatchRegisterCollateralInput = z.infer<typeof batchRegisterCollateralSchema>;

/**
 * Builds a `register_livestock` Soroban contract transaction for a single animal
 * registration.
 *
 * @param input - Validated collateral registration payload (see
 *   {@link registerCollateralSchema}).
 * @returns Unsigned XDR transaction envelope ready for client-side signing.
 * @throws If the RPC simulation or transaction preparation fails.
 */
export async function registerCollateral(input: RegisterCollateralInput): Promise<{ xdr: string }> {
  const { owner, animal_type, count, appraised_value } = input;
  const xdrTx = await buildContractTx(owner, 'register_livestock', [
    new Address(owner).toScVal(),
    nativeToScVal(animal_type, { type: 'symbol' }),
    nativeToScVal(count, { type: 'u32' }),
    nativeToScVal(BigInt(appraised_value), { type: 'i128' }),
  ]);
  return { xdr: xdrTx };
}

/**
 * Builds `register_livestock` transactions for multiple collateral items in one
 * call, using {@link registerCollateral} for each item and resolving all
 * promises concurrently.
 *
 * @param input - Validated batch payload containing 1–50 registration items
 *   (see {@link batchRegisterCollateralSchema}).
 * @returns An object whose `results` array contains one `{ xdr }` entry per
 *   input item, in the same order as the input.
 * @throws If any individual RPC simulation or transaction preparation fails.
 */
export async function batchRegisterCollateral(
  input: BatchRegisterCollateralInput
): Promise<{ results: Array<{ xdr: string }> }> {
  const results = await Promise.all(input.items.map((item) => registerCollateral(item)));
  return { results };
}

/**
 * Fetches a collateral record from the local off-chain database by its ID.
 *
 * @param id - Collateral record identifier (stringified integer primary key).
 * @returns The collateral record object, or `undefined` if no record with that
 *   ID exists.
 */
export function getCollateralById(id: string) {
  return getCollateral(id);
}
