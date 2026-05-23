const MAXELPAY_API = "https://api.maxelpay.com/api/v1";

interface PaymentSessionParams {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  callbackUrl: string;
}

interface PaymentSessionResponse {
  url: string;
  sessionId?: string;
  checkoutUrl?: string;
}

interface SessionStatusResponse {
  status: "pending" | "completed" | "failed" | "partially_completed";
  orderId?: string;
  amount?: number;
  currency?: string;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${MAXELPAY_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.MAXELPAY_API_KEY || "",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MaxelPay error (${res.status}): ${err}`);
  }

  return res.json();
}

export async function createPaymentSession(
  params: PaymentSessionParams
): Promise<PaymentSessionResponse> {
  const result = await request<PaymentSessionResponse>("/payments/sessions", {
    method: "POST",
    body: JSON.stringify(params),
  });

  return result;
}

export async function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  return request<SessionStatusResponse>(`/payments/sessions/${sessionId}/status`);
}

import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
