import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { AppError } from "@/lib/errors";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google",
]);

function ipv4ToNumber(address: string) {
  return address
    .split(".")
    .reduce((number, part) => (number << 8) + Number(part), 0) >>> 0;
}

function inIpv4Range(address: string, base: string, prefix: number) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToNumber(address) & mask) === (ipv4ToNumber(base) & mask);
}

function isBlockedIpv4(address: string) {
  return [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ].some(([base, prefix]) => inIpv4Range(address, String(base), Number(prefix)));
}

function isBlockedIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("2001:db8:")
  ) {
    return true;
  }

  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isBlockedIpv4(mapped) : false;
}

function isBlockedAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version === 6) return isBlockedIpv6(address);
  return true;
}

export interface ValidatedInspectableUrl {
  url: URL;
  address: string;
  family: 4 | 6;
}

export async function validateInspectableUrl(
  value: unknown,
): Promise<ValidatedInspectableUrl> {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) {
    throw new AppError("invalid_url", "확인할 앱 주소를 입력해 주세요.");
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new AppError("invalid_url", "앱 주소 형식을 확인해 주세요.");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new AppError("invalid_url", "웹 주소만 확인할 수 있어요.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new AppError("https_required", "안전한 HTTPS 앱 주소를 입력해 주세요.");
  }
  if (url.username || url.password) {
    throw new AppError("invalid_url", "로그인 정보가 포함된 주소는 확인할 수 없어요.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new AppError("blocked_url", "이 주소는 안전을 위해 확인할 수 없어요.", 403);
  }

  const literalVersion = isIP(hostname);
  let address: string;
  let family: 4 | 6;
  if (literalVersion) {
    if (isBlockedAddress(hostname)) {
      throw new AppError("blocked_url", "이 주소는 안전을 위해 확인할 수 없어요.", 403);
    }
    address = hostname;
    family = literalVersion === 6 ? 6 : 4;
  } else {
    let addresses;
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new AppError("unreachable_url", "앱 주소를 찾을 수 없어요.", 422);
    }
    if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) {
      throw new AppError("blocked_url", "이 주소는 안전을 위해 확인할 수 없어요.", 403);
    }
    const preferredAddress =
      addresses.find((candidate) => candidate.family === 4) ?? addresses[0];
    address = preferredAddress.address;
    family = preferredAddress.family === 6 ? 6 : 4;
  }

  url.hash = "";
  return { url, address, family };
}
