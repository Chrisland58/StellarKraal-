/**
 * Tests for useSessionTimeout + SessionTimeoutBanner — Issue #569
 */
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionTimeoutBanner from "@/components/SessionTimeoutBanner";

// ── helpers ─────────────────────────────────────────────────────────────────

/**
 * Encode a minimal JWT-like cookie value with the given exp timestamp.
 * The hook only reads the payload's `exp` field so this is sufficient.
 */
function makeSessionCookie(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: "user-1", exp: expSeconds }));
  return `session=${header}.${payload}.fakesig`;
}

function setCookie(value: string) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value,
  });
}

function clearCookie() {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value: "",
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  clearCookie();
});

afterEach(() => {
  jest.useRealTimers();
  clearCookie();
});

// ── useSessionTimeout ────────────────────────────────────────────────────────

describe("useSessionTimeout (#569)", () => {
  it("showBanner is false when no session cookie is present", () => {
    const { result } = renderHook(() => useSessionTimeout());
    expect(result.current.showBanner).toBe(false);
  });

  it("showBanner is false when token expires in more than 5 minutes", () => {
    const expInTenMin = Math.floor(Date.now() / 1000) + 10 * 60;
    setCookie(makeSessionCookie(expInTenMin));
    const { result } = renderHook(() => useSessionTimeout());
    act(() => {
      jest.advanceTimersByTime(0); // trigger useEffect
    });
    expect(result.current.showBanner).toBe(false);
  });

  it("showBanner is true when token expires in less than 5 minutes", () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));
    const { result } = renderHook(() => useSessionTimeout());
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current.showBanner).toBe(true);
  });

  it("secondsLeft decrements over time", async () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));
    const { result } = renderHook(() => useSessionTimeout());

    act(() => {
      jest.advanceTimersByTime(0);
    });
    const initialSeconds = result.current.secondsLeft;

    act(() => {
      jest.advanceTimersByTime(5000); // advance 5 s
    });
    expect(result.current.secondsLeft).toBeLessThan(initialSeconds);
  });

  it("calls the refresh endpoint when refresh() is invoked", async () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const { result } = renderHook(() => useSessionTimeout());

    await act(async () => {
      await result.current.refresh();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/refresh"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sets refreshError when refresh endpoint returns non-ok", async () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const { result } = renderHook(() => useSessionTimeout());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.refreshError).toMatch(/401/);
  });
});

// ── SessionTimeoutBanner ────────────────────────────────────────────────────

describe("SessionTimeoutBanner (#569)", () => {
  it("renders nothing when no session cookie is present", () => {
    const { container } = render(<SessionTimeoutBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the banner when token expires within 5 minutes", () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    render(<SessionTimeoutBanner />);
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("session-timeout-banner")).toBeInTheDocument();
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
  });

  it("shows a countdown timer in the banner", () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    render(<SessionTimeoutBanner />);
    act(() => {
      jest.advanceTimersByTime(0);
    });

    const countdown = screen.getByTestId("session-countdown");
    expect(countdown).toBeInTheDocument();
    // Format is m:ss — e.g. "2:59"
    expect(countdown.textContent).toMatch(/^\d+:\d{2}$/);
  });

  it('renders a "Refresh Session" button', () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    render(<SessionTimeoutBanner />);
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(
      screen.getByRole("button", { name: /refresh.*session/i })
    ).toBeInTheDocument();
  });

  it("calls refresh when button is clicked", async () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 } as Response);

    render(<SessionTimeoutBanner />);
    act(() => {
      jest.advanceTimersByTime(0);
    });

    const btn = screen.getByRole("button", { name: /refresh.*session/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/refresh"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("banner has role=alert for screen-reader announcement", () => {
    const expIn3Min = Math.floor(Date.now() / 1000) + 3 * 60;
    setCookie(makeSessionCookie(expIn3Min));

    render(<SessionTimeoutBanner />);
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
