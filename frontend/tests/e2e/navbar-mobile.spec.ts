import { test, expect } from "@playwright/test";

/**
 * E2E: Navbar mobile responsiveness (#524)
 *
 * Acceptance criteria covered here:
 *  - All nav links are reachable on screens narrower than 640 px
 *  - Hamburger icon toggles a drawer containing the nav links
 *  - Drawer closes when a link is clicked or the overlay is tapped
 *  - Focus is trapped inside the open drawer
 *
 * The home page ("/") renders the global Navbar with no wallet/auth gate,
 * so no mocking is required to exercise it.
 */

test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE-ish, well under 640px

test.describe("Navbar — mobile (< 640px)", () => {
  test("hamburger opens a drawer with all nav links, and clicking a link navigates and closes it", async ({
    page,
  }) => {
    await page.goto("/");

    const hamburger = page.getByRole("button", { name: /open menu/i });
    await expect(hamburger).toBeVisible();

    const drawer = page.locator("#mobile-menu");
    await expect(drawer).toBeHidden();

    await hamburger.click();
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /loans/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /collateral/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /settings/i })).toBeVisible();

    await drawer.getByRole("link", { name: /loans/i }).click();
    await expect(page).toHaveURL(/\/loans/);
    await expect(drawer).toBeHidden();
  });

  test("drawer closes when the overlay behind it is tapped", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();
    const drawer = page.locator("#mobile-menu");
    await expect(drawer).toBeVisible();

    // Tap the overlay well below the drawer's own content, outside its links.
    await page.mouse.click(10, page.viewportSize()!.height - 10);
    await expect(drawer).toBeHidden();
  });

  test("focus is trapped inside the open drawer", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();
    const drawer = page.locator("#mobile-menu");
    await expect(drawer).toBeVisible();

    // Tabbing repeatedly should never move focus outside the drawer while it's open.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const focusIsInsideDrawer = await drawer.evaluate(
        (el) => el.contains(document.activeElement)
      );
      expect(focusIsInsideDrawer).toBe(true);
    }
  });
});
