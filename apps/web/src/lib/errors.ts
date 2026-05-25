export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class AuthError extends ServiceError {
  constructor(message = "غير مصرح") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message = "ليس لديك صلاحية") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = "المورد غير موجود") {
    super("NOT_FOUND", message, 404);
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 422, details);
  }
}

export class InsufficientCoinsError extends ServiceError {
  constructor(balance: number, required: number) {
    super("INSUFFICIENT_COINS", `رصيد غير كافٍ. لديك ${balance} وتحتاج ${required}`, 402, { balance, required });
  }
}
