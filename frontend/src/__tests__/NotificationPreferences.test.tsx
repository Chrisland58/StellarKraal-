import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import NotificationPreferences from "../components/NotificationPreferences";

const mockSuccess = jest.fn();
const mockError = jest.fn();

jest.mock("../components/toast", () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  mockSuccess.mockReset();
  mockError.mockReset();
  (global as any).fetch = fetchMock;
});

const defaultSettings = {
  healthFactorAlerts: true,
  repaymentReminders: true,
  liquidationWarnings: true,
};

describe("NotificationPreferences", () => {
  it("renders all three toggles after loading", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => defaultSettings });
    await act(async () => {
      render(<NotificationPreferences wallet="GTEST" />);
    });
    expect(screen.getByLabelText("Health factor alerts")).toBeTruthy();
    expect(screen.getByLabelText("Repayment reminders")).toBeTruthy();
    expect(screen.getByLabelText("Liquidation warnings")).toBeTruthy();
  });

  it("shows checked state for enabled toggles", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => defaultSettings });
    await act(async () => {
      render(<NotificationPreferences wallet="GTEST" />);
    });
    const toggle = screen.getByLabelText("Health factor alerts");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("calls PATCH and shows success toast on toggle", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => defaultSettings })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...defaultSettings, healthFactorAlerts: false }),
      });

    await act(async () => {
      render(<NotificationPreferences wallet="GTEST" />);
    });

    const toggle = screen.getByLabelText("Health factor alerts");
    await act(async () => {
      fireEvent.click(toggle);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, url, opts] = fetchMock.mock.calls[1];
    expect(fetchMock.mock.calls[1][0]).toContain("/profile/settings");
    expect(mockSuccess).toHaveBeenCalledWith("Notification preference saved.");
  });

  it("shows error toast and reverts on PATCH failure", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => defaultSettings })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    await act(async () => {
      render(<NotificationPreferences wallet="GTEST" />);
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Health factor alerts"));
    });

    await waitFor(() => expect(mockError).toHaveBeenCalled());
    expect(mockError).toHaveBeenCalledWith("Failed to save preference. Please try again.");
    // Reverted: toggle should be back to true
    expect(screen.getByLabelText("Health factor alerts").getAttribute("aria-checked")).toBe("true");
  });
});
