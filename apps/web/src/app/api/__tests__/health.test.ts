import { describe, it, expect } from "vitest";

describe("Health Endpoint", () => {
  it("should return health check response", async () => {
    const res = await fetch("http://localhost:3000/api/health");
    const data = await res.json();

    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("checks");
    expect(data.checks).toHaveProperty("database");
    expect(data.checks).toHaveProperty("redis");
  });
});
