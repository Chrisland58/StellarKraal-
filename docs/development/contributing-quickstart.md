# Contributing Quickstart

This guide gets you from a fresh machine to an open pull request in one sitting. It covers prerequisites, cloning and environment setup, running tests, and opening your first PR.

> **Tested on:** Ubuntu 22.04 LTS and macOS 14 (Sonoma). Windows users should run all commands inside WSL2 (Ubuntu 22.04).

---

## Prerequisites

Install the following tools before you begin. Version numbers are minimums.

| Tool | Minimum version | Install command |
|------|-----------------|-----------------|
| Node.js | **20.x** | `nvm install 20` (see [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)) |
| npm | **10.x** | Bundled with Node 20 |
| Git | **2.x** | `sudo apt install git` / `brew install git` |
| Rust | **1.78+** | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| stellar-cli | **22+** | `cargo install --locked stellar-cli --features opt` |
| Docker & Compose | **24+** (optional) | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Freighter wallet | latest | [freighter.app](https://www.freighter.app/) (browser extension) |

### Ubuntu 22.04 — system dependencies

```bash
sudo apt update
sudo apt install -y build-essential libssl-dev pkg-config sqlite3 libsqlite3-dev curl git
```

### macOS — system dependencies

```bash
xcode-select --install        # command-line tools (includes git, clang)
brew install sqlite           # SQLite (optional — usually pre-installed)
```

### Verify your environment

```bash
node --version     # v20.x or higher
npm --version      # 10.x or higher
rustc --version    # 1.78.x or higher
stellar --version  # 22.x or higher
git --version      # 2.x or higher
```

---

## 1. Fork and Clone

1. Visit [github.com/teslims2/StellarKraal-](https://github.com/teslims2/StellarKraal-) and click **Fork**.
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/StellarKraal-.git
cd StellarKraal-
```

3. Add the upstream remote so you can pull in future changes:

```bash
git remote add upstream https://github.com/teslims2/StellarKraal-.git
```

---

## 2. Environment Configuration

Copy the example environment file and edit as needed:

```bash
cp env.example .env
```

For local development the defaults are sufficient. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_NETWORK` | `testnet` | Stellar network |
| `RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint |
| `PORT` | `3001` | Backend port |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Frontend → backend URL |

---

## 3. Install Dependencies

Install root, backend, and frontend dependencies:

```bash
# Root (Husky git hooks + shared tooling)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

> **Tip:** If `sqlite3` fails to build, run `npm rebuild sqlite3` inside `backend/` after installing the system packages in the prerequisites section.

---

## 4. Run the Development Servers

Open two terminal windows (or use `tmux`):

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# API available at http://localhost:3001
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# App available at http://localhost:3000
```

Alternatively, start everything with Docker Compose in a single terminal:

```bash
docker-compose up --build
```

---

## 5. Smart Contract Setup (optional)

Only required if you are working on the Soroban contract in `contracts/stellarkraal/`.

```bash
# Add the WebAssembly target
rustup target add wasm32-unknown-unknown

# Build the contract
cd contracts/stellarkraal
cargo build --target wasm32-unknown-unknown --release
```

---

## 6. Run the Tests

Make sure all tests pass before making any changes — this confirms your environment is healthy.

```bash
# From the repository root:

# Frontend unit tests (Jest)
npm run test:frontend

# Backend unit + integration tests (Jest)
npm run test:backend

# Smart contract tests (cargo)
npm run test:contract
```

### Run a single test file

```bash
# Backend
cd backend && npx jest src/index.test.ts

# Frontend
cd frontend && npx jest src/components/__tests__/Hero.test.tsx
```

### E2E tests (Playwright)

E2E tests require both servers to be running:

```bash
# In one terminal: start both servers (or use Docker Compose)
# In another terminal:
npm run test:e2e
```

For a full guide to running E2E tests locally, see [docs/testing/e2e-tests.md](../testing/e2e-tests.md).

---

## 7. Create a Branch

Always branch from the latest `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feat/<short-description>
# e.g. git checkout -b feat/add-cattle-badge
```

Branch naming conventions:

| Prefix | When to use |
|--------|-------------|
| `feat/<name>` | New feature |
| `fix/<name>` | Bug fix |
| `chore/<name>` | Tooling, CI, dependency update |
| `docs/<name>` | Documentation only |

---

## 8. Make Your Changes

A few guidelines as you work:

- **Follow the code style** — the project uses ESLint and Prettier. Run `npm run lint` and `npm run format` before committing.
- **Write tests** — new features and bug fixes must include tests. Aim to keep coverage above 70%.
- **Design tokens** — frontend changes must use the token system in `frontend/src/lib/design-tokens.ts`. Never hardcode colours.
- **Accessibility** — ARIA labels and keyboard navigation are required. Run `npm run test:a11y` after frontend changes. See [docs/guides/accessibility.md](../guides/accessibility.md).
- **Commit style** — all commits must follow [Conventional Commits](https://www.conventionalcommits.org/). The Husky pre-commit hook enforces this.

```bash
# Good commit messages:
git commit -m "feat(collateral): add photo thumbnail to CollateralCard"
git commit -m "fix(loans): handle missing health factor gracefully"
git commit -m "docs: add contributing quickstart guide"
```

---

## 9. Push and Open a Pull Request

```bash
git push -u origin feat/<short-description>
```

Then open a PR on GitHub. The PR template prompts you for:

- A description of the change and the linked issue.
- What you tested.
- Any known limitations.

**Before marking ready for review, confirm:**

- [ ] CI is green (all checks pass in GitHub Actions).
- [ ] `npm run lint` passes locally.
- [ ] All tests pass (`npm run test:frontend`, `npm run test:backend`).
- [ ] Documentation is updated if you changed behaviour, setup, or environment variables.
- [ ] No secrets or credentials are committed.

---

## Common Setup Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| `nvm: command not found` | nvm not installed | Install via [nvm install guide](https://github.com/nvm-sh/nvm#installing-and-updating), then open a new shell |
| `npm ERR! code ERESOLVE` | Wrong Node version | Run `node --version`. If < 20, run `nvm use 20` |
| `sqlite3` build error | Missing native build tools | Run `sudo apt install build-essential libsqlite3-dev` then `npm rebuild sqlite3` |
| `stellar: command not found` | `~/.cargo/bin` not in PATH | Add `export PATH="$HOME/.cargo/bin:$PATH"` to `~/.bashrc` or `~/.zshrc` |
| `error[E0463]: can't find crate` | Wrong Rust toolchain / missing wasm target | `rustup target add wasm32-unknown-unknown` inside `contracts/stellarkraal/` |
| `PORT already in use` | Port 3001 occupied | Stop the conflicting process or set `PORT=3002` in `.env` |
| CORS errors from frontend | `FRONTEND_URL` not set | Add `FRONTEND_URL=http://localhost:3000` to backend `.env` |

For more troubleshooting help see [docs/troubleshooting.md](../../docs/troubleshooting.md) and the platform-specific notes in [docs/development/local-setup.md](local-setup.md).

---

## Contact and Help

| Channel | Use for |
|---------|---------|
| [GitHub Issues](https://github.com/teslims2/StellarKraal-/issues) | Bug reports, feature requests |
| [GitHub Discussions](https://github.com/teslims2/StellarKraal-/discussions) | Questions, design conversations |
| [SECURITY.md](../../SECURITY.md) | Reporting a security vulnerability |

---

## Further Reading

- [CONTRIBUTING.md](../../CONTRIBUTING.md) — commit conventions, branching, and the release process in detail
- [docs/development/onboarding.md](onboarding.md) — deeper architecture and codebase walkthrough
- [docs/development/local-setup.md](local-setup.md) — platform-specific setup (Docker, Windows WSL2)
- [docs/testing/e2e-tests.md](../testing/e2e-tests.md) — Playwright E2E test guide
- [docs/guides/accessibility.md](../guides/accessibility.md) — accessibility requirements and testing
- [docs/adr/](../adr/) — architecture decision records explaining key design choices
