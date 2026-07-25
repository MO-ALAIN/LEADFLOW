import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./test/global-setup.ts",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "file:./test.db",
      JWT_SECRET: "test-secret-with-at-least-32-characters",
      WEB_ORIGIN: "http://localhost:5173"
    }
  }
});
