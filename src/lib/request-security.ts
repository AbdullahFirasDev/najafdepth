import { createHash } from "crypto";

import { getOptionalEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

export function hashClientIp(ip: string) {
  if (!ip || ip === "unknown") {
    return undefined;
  }

  return createHash("sha256")
    .update(`${ip}:${getOptionalEnv("AUDIT_IP_HASH_SALT") ?? "alkindi"}`)
    .digest("hex");
}

export function getUserAgent(headers: Headers) {
  return headers.get("user-agent")?.slice(0, 500) || undefined;
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export function checkRequestRateLimit(
  request: Request,
  scope: string,
  maxRequests = 30,
  windowMs = 60_000,
) {
  const ip = getClientIp(request.headers);
  return checkRateLimit(`${scope}:${ip}`, maxRequests, windowMs);
}
