import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    baseURL: process.env.TEST_URL || "http://localhost:3000",
  },
  // TEST_URL 지정 시 이미 떠있는 서버 사용
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
