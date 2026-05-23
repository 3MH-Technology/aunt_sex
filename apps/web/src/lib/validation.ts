import { ValidationError } from "./errors";

export function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} مطلوب`);
  }
  return value.trim();
}

export function assertOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return undefined;
}

export function assertNumber(value: unknown, field: string): number {
  const num = Number(value);
  if (isNaN(num)) throw new ValidationError(`${field} يجب أن يكون رقماً`);
  return num;
}

export function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
): T {
  if (!allowed.includes(value as T)) {
    throw new ValidationError(
      `${field} غير صالح. القيم المسموحة: ${allowed.join(", ")}`
    );
  }
  return value as T;
}

export function assertEmail(value: unknown): string {
  const str = assertString(value, "البريد الإلكتروني");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    throw new ValidationError("البريد الإلكتروني غير صالح");
  }
  return str;
}

export function assertMinLength(value: string, min: number, field: string): string {
  if (value.length < min) {
    throw new ValidationError(`${field} يجب أن يكون ${min} أحرف على الأقل`);
  }
  return value;
}
