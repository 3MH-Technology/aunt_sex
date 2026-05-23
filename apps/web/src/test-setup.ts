import { beforeAll, afterAll } from "vitest";

// Setup test environment
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://auntsex:auntsex_pass@localhost:5432/auntsex_test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
