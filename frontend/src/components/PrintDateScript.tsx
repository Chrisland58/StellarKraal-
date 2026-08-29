"use client";
import { useEffect } from "react";

/**
 * PrintDateScript — #811
 *
 * Sets `data-print-date` on `<body>` to the current locale date string.
 * The print CSS uses `attr(data-print-date)` in the `body::after` footer
 * to show the date a loan summary was printed without any server round-trip.
 *
 * This is a zero-render client component — it returns null and only runs
 * a single useEffect on mount. It has no visual output on screen.
 */
export default function PrintDateScript() {
  useEffect(() => {
    const date = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    document.body.setAttribute("data-print-date", date);
  }, []);

  return null;
}
