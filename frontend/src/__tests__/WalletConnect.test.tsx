/**
 * WalletConnect component tests — #808
 *
 * Covers all four button states:
 *   disconnected | connecting | connected | error
 * plus accessibility attributes and keyboard navigation.
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import WalletConnect from "../components/WalletConnect";

// ── Mock the useWallet hook so we control every state ──────────────────────
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

const defaultWalletState = {
  address: null as string | null,
  freighterInstalled: true as boolean | null,
  connecting: false,
  error: null as string | null,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

let walletState = { ...defaultWalletState };

jest.mock("../hooks/useWallet", () => ({
  useWallet: () => walletState,
}));

// ── Silence act() warnings from state updates in useEffect ─────────────────
beforeEach(() => {
  jest.clearAllMocks();
  walletState = { ...defaultWalletState };
});

// ── Disconnected (default) state ───────────────────────────────────────────
describe("WalletConnect — disconnected state", () => {
  it("renders 'Connect Wallet' CTA", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeTruthy();
  });

  it("calls connect() when button is clicked", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("button is keyboard accessible (type=button)", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /connect wallet/i });
    // Default button type prevents accidental form submission
    expect(btn.tagName).toBe("BUTTON");
  });

  it("has a descriptive aria-label", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /connect.*(freighter|wallet)/i });
    expect(btn).toBeTruthy();
  });
});

// ── Connecting state ───────────────────────────────────────────────────────
describe("WalletConnect — connecting state", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, connecting: true };
  });

  it("renders spinner while connecting", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders 'Connecting…' text", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByText(/connecting…/i)).toBeTruthy();
  });

  it("button is disabled during connection", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /connecting/i });
    expect(btn).toBeDisabled();
  });

  it("sets aria-busy=true during connection", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const btn = screen.getByRole("button", { name: /connecting/i });
    expect(btn).toHaveAttribute("aria-busy", "true");
  });
});

// ── Connected state ────────────────────────────────────────────────────────
describe("WalletConnect — connected state", () => {
  const address = "GABCDEF1234567890ABCDEF";

  beforeEach(() => {
    walletState = { ...defaultWalletState, address };
  });

  it("shows a truncated wallet address", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    // First 8 chars
    expect(screen.getByText(/GABCDEF1/)).toBeTruthy();
  });

  it("calls onConnect with the address", () => {
    const onConnect = jest.fn();
    render(<WalletConnect onConnect={onConnect} />);
    expect(onConnect).toHaveBeenCalledWith(address);
  });

  it("renders a Disconnect button", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeTruthy();
  });

  it("calls disconnect() when Disconnect is clicked", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("has a status role announcing the connected address", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-label")).toMatch(/wallet connected/i);
  });
});

// ── Error state ────────────────────────────────────────────────────────────
describe("WalletConnect — error state", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, error: "User rejected the request" };
  });

  it("renders 'Connect Failed' message", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByText(/connect failed/i)).toBeTruthy();
  });

  it("shows the error detail", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByText(/user rejected the request/i)).toBeTruthy();
  });

  it("renders a Retry Connection button", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
  });

  it("calls connect() when retry is clicked", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("uses an alert role so screen readers announce the error immediately", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("has aria-live=assertive on the error container", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });
});

// ── Freighter not installed ────────────────────────────────────────────────
describe("WalletConnect — Freighter not installed", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, freighterInstalled: false };
  });

  it("renders install link when Freighter is absent", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    expect(screen.getByText(/install freighter/i)).toBeTruthy();
  });

  it("install link points to freighter.app", () => {
    render(<WalletConnect onConnect={jest.fn()} />);
    const link = screen.getByRole("link", { name: /install freighter/i });
    expect(link.getAttribute("href")).toBe("https://freighter.app");
  });
});

// ── Detection pending ──────────────────────────────────────────────────────
describe("WalletConnect — Freighter detection pending", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, freighterInstalled: null };
  });

  it("renders nothing while Freighter detection is in progress", () => {
    const { container } = render(<WalletConnect onConnect={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
