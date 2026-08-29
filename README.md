---

## Features

- 🐄 Register livestock (cattle, goats, sheep) as on-chain collateral
- 💸 Request loans against appraised collateral value
- 📊 Real-time health factor monitoring
- 🔁 Partial and full loan repayment
- ⚡ Liquidation engine for undercollateralized positions
- 🔐 Freighter wallet integration
- 🌍 Built for African emerging markets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Soroban SDK 21.x |
| Backend | Node.js, TypeScript, Express |
| Frontend | React 18, Next.js 14, TypeScript |
| Styling | Tailwind CSS |
| Wallet | Freighter API |
| Infrastructure | Docker, Docker Compose |
| Network | Stellar Testnet / Mainnet |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Rust + `stellar-cli`
- Node.js 20+
- Freighter browser extension

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/stellarkraal.git
cd stellarkraal
cp .env.example .env
```

### 2. Configure Environment
```env
NEXT_PUBLIC_NETWORK=testnet
RPC_URL=https://soroban-testnet.stellar.org
CONTRACT_ID=your_deployed_contract_id
PORT=3001
```

### 3. Build & Deploy Contract
```bash
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellarkraal.wasm \
  --network testnet \
  --source your-account
```

### 4. Run with Docker
```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/collateral/register` | Register livestock collateral |
| POST | `/api/loan/request` | Request a new loan |
| POST | `/api/loan/repay` | Repay a loan (partial/full) |
| GET | `/api/loan/:id` | Fetch loan record |
| GET | `/api/health/:loanId` | Get loan health factor |

---

## Contract Functions

| Function | Description |
|---|---|
| `initialize` | Set admin, oracle, token, and protocol params |
| `register_livestock` | Register animal collateral on-chain |
| `request_loan` | Validate collateral and disburse loan |
| `repay_loan` | Partial or full repayment |
| `liquidate` | Liquidate undercollateralized position |
| `health_factor` | Returns current health score |

---

## Running Tests

```bash
# Smart contract tests (25 cases)
npm run test:contract

# Backend API tests
npm run test:backend

# Frontend component tests
npm run test:frontend
```

---

## Architecture Decision Records (ADRs)

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-009](docs/adr/ADR-009-api-v2-design.md) | API v2: REST vs GraphQL vs tRPC | Accepted |

---

## License

MIT © StellarKraal
