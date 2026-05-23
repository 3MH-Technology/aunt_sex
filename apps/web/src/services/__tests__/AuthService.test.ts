import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { authService } from "../AuthService";
import { ValidationError } from "@/lib/errors";

describe("AuthService", () => {
  describe("signup", () => {
    it("should reject short password", async () => {
      await expect(
        authService.signup({
          email: "test@test.com",
          password: "123",
          name: "Test",
          username: "testuser",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should reject invalid email", async () => {
      await expect(
        authService.signup({
          email: "not-an-email",
          password: "password123",
          name: "Test",
          username: "testuser",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should reject username with special characters", async () => {
      await expect(
        authService.signup({
          email: "test@test.com",
          password: "password123",
          name: "Test",
          username: "user name!",
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
