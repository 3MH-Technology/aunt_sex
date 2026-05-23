import { BaseService } from "./BaseService";
import { logger } from "@/lib/logger";

export class MaintenanceService extends BaseService {
  async cleanupExpiredSubscriptions() {
    const result = await this.db.subscription.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired subscriptions`);
    }
    return result.count;
  }

  async cleanupExpiredSessions() {
    const result = await this.db.session.deleteMany({
      where: { expires: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired sessions`);
    }
    return result.count;
  }

  async cleanupExpiredVerificationTokens() {
    const result = await this.db.verificationToken.deleteMany({
      where: { expires: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired verification tokens`);
    }
    return result.count;
  }

  async markExpiredStreams() {
    const result = await this.db.liveStream.updateMany({
      where: {
        isLive: true,
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      data: { isLive: false },
    });
    if (result.count > 0) {
      logger.info(`Marked ${result.count} stale streams as offline`);
    }
    return result.count;
  }

  async runAll() {
    const results = await Promise.all([
      this.cleanupExpiredSubscriptions(),
      this.cleanupExpiredSessions(),
      this.cleanupExpiredVerificationTokens(),
      this.markExpiredStreams(),
    ]);

    const total = results.reduce((a, b) => a + b, 0);
    logger.info(`Maintenance complete: ${total} records cleaned`);

    return {
      subscriptionsCleaned: results[0],
      sessionsCleaned: results[1],
      tokensCleaned: results[2],
      streamsMarkedOffline: results[3],
    };
  }
}

export const maintenanceService = new MaintenanceService();
