/**
 * Shared Soroban transaction builder used by loan and collateral services.
 */
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  xdr,
} from "@stellar/stellar-sdk";
import { config } from "../config";
import rpcClient from "../utils/rpcClient";

/**
 * Soroban contract ID sourced from the `CONTRACT_ID` environment variable.
 * An empty string is used as a safe default so that unit tests that mock the
 * RPC client can still import the module without crashing.
 */
const CONTRACT_ID = process.env.CONTRACT_ID || "";

/**
 * Stellar network passphrase used when building and signing transactions.
 * Resolves to {@link Networks.PUBLIC} on mainnet and {@link Networks.TESTNET}
 * for every other value of `NEXT_PUBLIC_NETWORK`.
 */
const NETWORK_PASSPHRASE =
  config.NEXT_PUBLIC_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

/**
 * Builds an unsigned Soroban contract transaction XDR ready for client signing.
 *
 * The function fetches the current sequence number for `sourceAddress` from the
 * Soroban RPC, assembles a single-operation transaction that invokes `method`
 * on the contract identified by {@link CONTRACT_ID}, simulates the transaction
 * to populate the authorisation footprint and resource fees, and returns the
 * prepared XDR envelope as a base64-encoded string.
 *
 * @param sourceAddress - Stellar G-address of the account that will sign the
 *   returned transaction.
 * @param method - Name of the Soroban contract entry-point to invoke.
 * @param args - Encoded `xdr.ScVal` arguments to pass to the contract method,
 *   in the same order as the contract function signature.
 * @returns Base64-encoded XDR of the unsigned, prepared transaction envelope.
 * @throws If the account cannot be fetched, if the RPC simulation fails, or if
 *   transaction preparation returns an error.
 */
export async function buildContractTx(
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const account = (await rpcClient.getAccount(sourceAddress)) as any;
  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const prepared = (await rpcClient.prepareTransaction(tx)) as any;
  return prepared.toXDR();
}

export { CONTRACT_ID, NETWORK_PASSPHRASE };
