import { defineConfig, devices } from "@playwright/test";

// Smoke tests: a production build at phone width (375 px). Run them with `npm run test:smoke` (`npx playwright install webkit` once).
// Later tasks bring the local Supabase's address and keys (scripts/test-smoke.sh, as in Kindred).
const port = 3300;

export default defineConfig({
  testDir: "tests/smoke",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${port}`, ...devices["iPhone SE"], viewport: { width: 375, height: 667 }, trace: "retain-on-failure" },
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
