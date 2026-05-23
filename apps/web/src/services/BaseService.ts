import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export abstract class BaseService {
  protected db = db;
  protected logger = logger;
}
