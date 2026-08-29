# Freighter Wallet Integration

[Freighter](https://www.freighter.app/) is a browser extension that manages Stellar key pairs and
signs transactions without ever exposing the private key to the web page. StellarKraal uses
Freighter to sign XDR transactions returned by the backend before they are submitted to the
Stellar network.

This guide covers:

- How the `freighterClient.ts` wrapper works
- The connect, disconnect, and sign-transaction flow
- The `getTestApi()` mock used in testing
- Network switching and mismatch detection

---

## Installation

Install the Freighter browser extension from the official site:
[https://www.freighter.app/](https://www.freighter.app/)

> Freighter is available for Chrome, Brave, Firefox, and Edge.

The frontend depends on `@stellar/freighter-api` (npm package). This is already listed as a
dependency in `frontend/package.json`.

---

## The `freighterClient.ts` Wrapper

`frontend/src/lib/freighterClient.ts` is a thin abstraction over `@stellar/freighter-api` that:

1. Delegates every call to the real Freighter extension in production.
2. Falls back to `window.__STELLARKRAAL_E2E__` (a test mock) when that property is set.

This design means tests and E2E runners never need the browser extension.

### Exported Functions

#### `isConnected(): Promise<{ isConnected: boolean }>`

Returns whether the Freighter extension is installed and reachable in the current browser. A
result of `{ isConnected: false }` means the extension is not installed (or the API is
unreachable); it does **not** mean the user has no account selected.

```ts
import { isConnected } from "@/lib/freighterClient";

const { isConnected: installed } = await isConnected();
if (!installed) {
  // prompt user to install Freighter
}
```

#### `isAllowed(): Promise<{ isAllowed: boolean }>`

Returns whether the current page has been granted permission to read the user's public key. The
permission is granted once via `setAllowed()` and persists until the user revokes it.

```ts
import { isAllowed } from "@/lib/freighterClient";

const { isAllowed: permitted } = await isAllowed();
```

#### `setAllowed(): Promise<{ isAllowed: boolean }>`

Opens the Freighter permission prompt asking the user to grant this origin access to their public
key. Must be called before `getAddress()` if the page has not been allowed yet.

```ts
import { setAllowed } from "@/lib/freighterClient";

await setAllowed(); // triggers the Freighter popup
```

#### `getAddress(): Promise<{ address: string }>`

Returns the public key (G… address) of the currently selected Freighter account.

```ts
import { getAddress } from "@/lib/freighterClient";

const { address } = await getAddress();
// address === "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
```

#### `signTransaction(xdr, opts?): Promise<{ signedTxXdr: string }>`

Passes an unsigned XDR transaction to Freighter for the user to review and sign. Returns the
signed XDR string.

```ts
import { signTransaction } from "@/lib/freighterClient";

const { signedTxXdr } = await signTransaction(unsignedXdr, {
  networkPassphrase: "Test SDF Network ; September 2015",
  address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
});
```

Options:

| Option | Type | Description |
|--------|------|-------------|
| `network` | string | Alias for `networkPassphrase` (accepted for backwards compatibility) |
| `networkPassphrase` | string | Full Stellar network passphrase. Use this for explicit network identification. |
| `address` | string | The signing account's public key. Freighter will warn if it does not match the active account. |

---

## Connect, Disconnect, and Sign — The `useWallet` Hook

The React hook `frontend/src/hooks/useWallet.ts` encapsulates the full wallet lifecycle and is
the primary integration point for UI components.

```ts
import { useWallet } from "@/hooks/useWallet";

function MyComponent() {
  const { address, freighterInstalled, connecting, error, connect, disconnect } = useWallet();
  // ...
}
```

### State fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | `string \| null` | The connected Stellar public key, or `null` when disconnected |
| `freighterInstalled` | `boolean \| null` | `true` = extension detected, `false` = not found, `null` = still detecting |
| `connecting` | `boolean` | `true` while the connect flow is in progress |
| `error` | `string \| null` | Error message from the last failed operation, or `null` |

### `connect()`

Runs the full connection flow:

1. Calls `setAllowed()` — opens the Freighter permission prompt if not already granted.
2. Calls `getAddress()` — retrieves the public key.
3. Persists the address to `localStorage` under the key `stellarkraal_wallet`.

On subsequent page loads the hook restores the persisted address automatically after verifying
the extension still reports `isAllowed()`.

```ts
await connect();
// address is now populated if the user approved the prompt
```

### `disconnect()`

Clears `address` from state and removes the persisted value from `localStorage`. Does **not**
revoke the Freighter permission — the user must do that manually from the extension.

```ts
disconnect();
// address === null
```

### Signing a transaction from a component

After obtaining an unsigned XDR from the backend, pass it to `signTransaction`:

```ts
import { signTransaction } from "@/lib/freighterClient";
import { useWallet } from "@/hooks/useWallet";

function LoanRequestButton({ xdr }: { xdr: string }) {
  const { address } = useWallet();

  async function handleSign() {
    const { signedTxXdr } = await signTransaction(xdr, {
      networkPassphrase: process.env.NEXT_PUBLIC_NETWORK === "mainnet"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015",
      address: address ?? undefined,
    });

    // Submit signedTxXdr to the Stellar network or backend
  }

  return <button onClick={handleSign}>Sign & Submit</button>;
}
```

---

## The Mock API (`getTestApi`)

`freighterClient.ts` checks for `window.__STELLARKRAAL_E2E__` before calling the real Freighter
API. If the property is set, its methods take precedence.

### Type definition

```ts
type FreighterTestApi = Partial<{
  isConnected: () => Promise<{ isConnected: boolean }>;
  isAllowed:   () => Promise<{ isAllowed: boolean }>;
  setAllowed:  () => Promise<{ isAllowed: boolean }>;
  getAddress:  () => Promise<{ address: string }>;
  signTransaction: (
    xdr: string,
    opts?: { network?: string }
  ) => Promise<{ signedTxXdr: string }>;
}>;

// Also available:
// submitSignedXdr?: (signedXdr: string) => Promise<string> | string;
```

All fields are optional — only the methods you set are overridden.

### Using the mock in Jest tests

```ts
beforeEach(() => {
  // install the mock before importing modules that use freighterClient
  Object.defineProperty(window, "__STELLARKRAAL_E2E__", {
    value: {
      isConnected: async () => ({ isConnected: true }),
      isAllowed:   async () => ({ isAllowed: true }),
      setAllowed:  async () => ({ isAllowed: true }),
      getAddress:  async () => ({ address: "GTEST1234567890" }),
      signTransaction: async (xdr: string) => ({
        signedTxXdr: "SIGNED_" + xdr,
      }),
    },
    writable: true,
  });
});

afterEach(() => {
  // clean up
  delete (window as any).__STELLARKRAAL_E2E__;
});
```

### Using the mock in Playwright E2E tests

In the Playwright config or a fixture, set the mock before navigating:

```ts
await page.addInitScript(() => {
  window.__STELLARKRAAL_E2E__ = {
    isConnected:     async () => ({ isConnected: true }),
    isAllowed:       async () => ({ isAllowed: true }),
    setAllowed:      async () => ({ isAllowed: true }),
    getAddress:      async () => ({ address: "GPLAYWRIGHTTEST1234567890" }),
    signTransaction: async (xdr) => ({ signedTxXdr: "SIGNED_" + xdr }),
    submitSignedXdr: async (signed) => "TX_HASH_MOCK",
  };
});
```

This allows E2E scenarios to test the full wallet-connected flow without requiring the Freighter
extension to be installed in the test browser.

---

## Network Switching and Mismatch Detection

`frontend/src/hooks/useNetworkMismatch.ts` compares the wallet's active network to the
app-configured network (`NEXT_PUBLIC_NETWORK`).

```ts
import { useNetworkMismatch } from "@/hooks/useNetworkMismatch";

function NetworkWarning({ walletAddress }: { walletAddress: string | null }) {
  const mismatch = useNetworkMismatch(walletAddress);

  if (mismatch) {
    return (
      <div role="alert">
        Your Freighter wallet is connected to a different network than this app.
        Please switch your wallet network to match <code>{process.env.NEXT_PUBLIC_NETWORK}</code>.
      </div>
    );
  }
  return null;
}
```

### How it works

1. The hook calls `getNetworkDetails()` from `@stellar/freighter-api` when `walletAddress`
   becomes non-null.
2. It compares `result.network.toLowerCase()` to `process.env.NEXT_PUBLIC_NETWORK.toLowerCase()`.
3. Returns `true` (mismatch) if the strings differ.
4. Returns `false` when the wallet address is `null` (not connected) or when the networks match.

### Network values

| `NEXT_PUBLIC_NETWORK` value | Freighter `network` value | Description |
|-----------------------------|---------------------------|-------------|
| `testnet` | `TESTNET` | Stellar test network |
| `mainnet` | `PUBLIC` | Stellar public network |
| `local` | (sandbox-specific) | Local Soroban sandbox |

The comparison is case-insensitive so `testnet` matches `TESTNET`.

### Handling a mismatch

Instruct the user to open Freighter and switch the active network. Freighter allows multiple
network profiles and the active one can be changed from the extension popup's settings. The
mismatch state updates automatically on the next render cycle after the wallet is reconnected.

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---------|-------|------------|
| `freighterInstalled === false` | Extension not installed | Install Freighter from [freighter.app](https://www.freighter.app/) |
| `connect()` shows no popup | Permission already granted | `setAllowed()` is a no-op if permission is already held; `getAddress()` will succeed immediately |
| `signTransaction` rejected | User dismissed the Freighter popup | Catch the error and show a user-friendly message |
| `signedTxXdr` rejected by network | Wrong `networkPassphrase` | Verify the passphrase matches the network in your `.env` |
| Network mismatch warning shown | Wallet on wrong network | Switch network in Freighter extension settings |
| `window.__STELLARKRAAL_E2E__ is not defined` in tests | Mock not installed | Set the mock in `beforeEach` before importing the module under test |

---

## Further Reading

- [Freighter API npm package](https://www.npmjs.com/package/@stellar/freighter-api)
- [Freighter Developer Docs](https://docs.freighter.app/)
- [Stellar Developer Docs — Transaction Signing](https://developers.stellar.org/docs/learn/fundamentals/transactions)
- [API Quickstart](./api-quickstart.md) — how to obtain unsigned XDR from the backend
- [XDR Transaction Building Guide](./xdr-transaction-building.md)
- [E2E Tests Guide](../testing/e2e-tests.md)
