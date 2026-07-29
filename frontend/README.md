# StellarKraal Frontend

React + Next.js 14 frontend for the StellarKraal livestock-backed lending platform.

## Development

```bash
npm install
npm run dev   # http://localhost:3000
```

See the root [README](../README.md) for full prerequisites and local setup instructions.

## Key Guides

| Guide | Description |
|-------|-------------|
| [Freighter Wallet Integration](../docs/guides/freighter-integration.md) | How `freighterClient.ts` works, connect/sign/disconnect flow, mock API for testing, network mismatch detection |
| [API Quickstart](../docs/guides/api-quickstart.md) | How to call the backend API and obtain signed XDR transactions |
| [Design Tokens](../docs/guides/design-tokens.md) | Design token system, light/dark mode, and Tailwind CSS usage |
| [Accessibility Guide](../docs/guides/accessibility.md) | ARIA patterns, testing commands, and pre-PR checklist |
| [E2E Tests](../docs/testing/e2e-tests.md) | Running Playwright tests locally |

## Testing

```bash
npm test              # Jest unit + component tests
npm run test:e2e      # Playwright E2E tests (requires running app)
npm run lint          # ESLint
```
