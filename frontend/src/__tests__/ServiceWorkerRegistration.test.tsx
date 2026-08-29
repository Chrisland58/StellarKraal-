import React from "react";
import { render } from "@testing-library/react";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

describe("ServiceWorkerRegistration", () => {
  it("renders nothing visible", () => {
    const { container } = render(<ServiceWorkerRegistration />);
    expect(container.firstChild).toBeNull();
  });

  it("registers the service worker when supported", () => {
    const registerMock = jest.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock },
      configurable: true,
    });

    render(<ServiceWorkerRegistration />);
    expect(registerMock).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("does not throw when serviceWorker is not supported", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
    });

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });
});
