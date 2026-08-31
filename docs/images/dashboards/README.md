# Dashboard Screenshots

This directory holds annotated screenshots of the StellarKraal Grafana dashboards, referenced from [docs/observability.md](../observability.md).

## Expected files

| File | Dashboard | Description |
|------|-----------|-------------|
| `backend-overview.png` | StellarKraal Backend | All 9 metric panels at 1920×1080 |
| `backend-db-pool.png` | StellarKraal Backend | Three DB pool panels zoomed in |
| `logs-overview.png` | StellarKraal Logs | All 4 log stream panels at 1920×1080 |

## How to generate screenshots

Screenshots must be taken from a **populated local dev environment** so panels display live data rather than "No data" placeholders.

1. Start the full stack:
   ```bash
   docker compose up --build
   ```
2. Seed with traffic (run the backend integration tests or the load-testing script):
   ```bash
   cd backend && npm test
   # or
   npm run test:load
   ```
3. Open Grafana at `http://localhost:3200`.
4. Set the time range to **Last 15 minutes**.
5. Navigate to each dashboard and export a PNG:
   - Use the Grafana **Share → Export as PNG** feature, or
   - Take a full-screen screenshot at 1920×1080 and crop to the dashboard area.
6. Save the files to this directory using the filenames above.
7. Update the `alt` text in `docs/observability.md` if any panel layouts have changed.
8. Commit the images and documentation changes in the same PR.

## Update policy

Screenshots should be refreshed whenever:

- A panel is added, removed, or significantly re-arranged in a dashboard JSON file.
- A new dashboard is added to `grafana/dashboards/`.
- The visual appearance changes substantially (e.g., new colour scheme or panel type).

Minor query changes or threshold adjustments that do not visually alter the dashboard layout do not require a screenshot update.
