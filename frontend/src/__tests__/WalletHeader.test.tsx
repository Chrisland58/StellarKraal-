/**
 * Tests for WalletHeader popover (issue #817)
 *
 * Covers:
 *  - Popover opens on trigger click
 *  - Popover shows full address, XLM balance, and network name
 *  - Copy address button
 *  - "View on Stellar Expert" link
 *  - Disconnect button closes popover and calls disconnect
 *  - Popover closes on Escape key
 *  - Popover closes on click-outside
 *  - Not-connected states: "Connect Wallet" and "Install Freighter"
 *  - Keyboard accessibility (aria attributes)
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WalletHeader from "../components/WalletHeader";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

const defaultWalletState = {
  address: null as string | null,
  freighterInstalled: null as boolean | null,
  connecting: false,
  error: null,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

let walletState = { ...defaultWalletState };

jest.mock("@/hooks/useWallet", () => ({
  useWallet: () => walletState,
}));

// Mock fetch for Horizon balance
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock clipboard
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_ADDRESS = "GABCDEFGHIJ1234567890ABCDEFGHIJ1234567890ABCDEFGHIJKLMNO";
const TRUNCATED = `${TEST_ADDRESS.slice(0, 8)}…${TEST_ADDRESS.slice(-6)}`;

function makeHorizonResponse(balance = "123.4567800") {
  return {
    ok: true,
    json: async () => ({
      balances: [
        { asset_type: "native", balance },
        { asset_type: "credit_alphanum4", asset_code: "USDC", balance: "50.00" },
      ],
    }),
  };
}

function renderHeader() {
  return render(<WalletHeader />);
}

// ── Test suites ───────────────────────────────────────────────────────────────

describe("WalletHeader — not connected", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState };
    jest.clearAllMocks();
  });

  it("shows Connect Wallet button when Freighter is installed but not connected", () => {
    walletState = { ...defaultWalletState, freighterInstalled: true };
    renderHeader();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("disables Connect Wallet while connecting", () => {
    walletState = { ...defaultWalletState, freighterInstalled: true, connecting: true };
    renderHeader();
    const btn = screen.getByRole("button", { name: /connecting/i });
    expect(btn).toBeDisabled();
  });

  it("shows Install Freighter link when Freighter is not installed", () => {
    walletState = { ...defaultWalletState, freighterInstalled: false };
    renderHeader();
    const link = screen.getByRole("link", { name: /install freighter/i });
    expect(link).toHaveAttribute("href", "https://freighter.app");
  });

  it("shows Connect Wallet in loading/null state", () => {
    walletState = { ...defaultWalletState, freighterInstalled: null };
    renderHeader();
    const btn = screen.getByRole("button", { name: /connect wallet/i });
    expect(btn).toBeDisabled();
  });
});

describe("WalletHeader — connected: trigger button", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, address: TEST_ADDRESS, freighterInstalled: true };
    mockFetch.mockResolvedValue(makeHorizonResponse());
    jest.clearAllMocks();
  });

  it("renders truncated address as the trigger button", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: TRUNCATED })).toBeInTheDocument();
  });

  it("trigger button has aria-haspopup=dialog", () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("trigger button starts with aria-expanded=false", () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("trigger button sets aria-expanded=true when popover is open", async () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("popover is not rendered initially", () => {
    renderHeader();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("WalletHeader — connected: popover content", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, address: TEST_ADDRESS, freighterInstalled: true };
    mockFetch.mockResolvedValue(makeHorizonResponse("123.4567800"));
    jest.clearAllMocks();
  });

  async function openPopover() {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);
    return screen.getByRole("dialog");
  }

  it("popover opens on trigger click", async () => {
    await openPopover();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("popover has aria-label='Wallet details'", async () => {
    await openPopover();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Wallet details");
  });

  it("popover shows the full address", async () => {
    await openPopover();
    expect(screen.getByTestId("wallet-full-address")).toHaveTextContent(TEST_ADDRESS);
  });

  it("popover shows the network name", async () => {
    await openPopover();
    // NEXT_PUBLIC_NETWORK defaults to TESTNET in test environment
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toMatch(/testnet/i);
  });

  it("popover shows XLM balance after fetch resolves", async () => {
    await openPopover();
    await waitFor(() =>
      expect(screen.getByTestId("wallet-xlm-balance")).toHaveTextContent(/xlm/i)
    );
    expect(screen.getByTestId("wallet-xlm-balance").textContent).toMatch(/123/);
  });

  it("popover shows '—' when balance fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);
    await waitFor(() =>
      expect(screen.getByTestId("wallet-xlm-balance")).toHaveTextContent("—")
    );
  });

  it("popover renders View on Stellar Expert link with correct href", async () => {
    await openPopover();
    const link = screen.getByTestId("wallet-stellar-expert-link");
    expect(link).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/account/${TEST_ADDRESS}`
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("popover renders Disconnect button", async () => {
    await openPopover();
    expect(screen.getByTestId("wallet-disconnect-btn")).toBeInTheDocument();
  });
});

describe("WalletHeader — connected: copy address", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, address: TEST_ADDRESS, freighterInstalled: true };
    mockFetch.mockResolvedValue(makeHorizonResponse());
    jest.clearAllMocks();
  });

  async function openPopover() {
    renderHeader();
    await userEvent.click(screen.getByRole("button", { name: TRUNCATED }));
  }

  it("copy button calls clipboard.writeText with full address", async () => {
    mockWriteText.mockResolvedValue(undefined);
    await openPopover();
    const copyBtn = screen.getByRole("button", { name: /copy address/i });
    await userEvent.click(copyBtn);
    expect(mockWriteText).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("copy button shows 'Address copied' label after copy", async () => {
    mockWriteText.mockResolvedValue(undefined);
    await openPopover();
    const copyBtn = screen.getByRole("button", { name: /copy address/i });
    await userEvent.click(copyBtn);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /address copied/i })).toBeInTheDocument()
    );
  });
});

describe("WalletHeader — connected: close behaviours", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState, address: TEST_ADDRESS, freighterInstalled: true };
    mockFetch.mockResolvedValue(makeHorizonResponse());
    jest.clearAllMocks();
  });

  it("popover closes when Escape is pressed", async () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("popover closes on click-outside", async () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("popover closes on second trigger click (toggle)", async () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking Disconnect calls disconnect and closes popover", async () => {
    renderHeader();
    const trigger = screen.getByRole("button", { name: TRUNCATED });
    await userEvent.click(trigger);

    const disconnectBtn = screen.getByTestId("wallet-disconnect-btn");
    await userEvent.click(disconnectBtn);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("WalletHeader — header brand", () => {
  beforeEach(() => {
    walletState = { ...defaultWalletState };
    jest.clearAllMocks();
  });

  it("always renders the StellarKraal brand name", () => {
    renderHeader();
    expect(screen.getByText(/stellarkraal/i)).toBeInTheDocument();
  });
});
