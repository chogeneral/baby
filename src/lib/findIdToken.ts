import { createHmac } from "crypto";

const SECRET = process.env.FIND_ID_SECRET ?? "find-id-default-secret-change-me";
const EXPIRY_MS = 15 * 60 * 1000; // 15분

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createFindIdToken(email: string): string {
  const emailB64 = Buffer.from(email).toString("base64url");
  const expiry = Date.now() + EXPIRY_MS;
  const payload = `${emailB64}.${expiry}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyFindIdToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [emailB64, expiryStr, sig] = parts;
  const payload = `${emailB64}.${expiryStr}`;

  if (sign(payload) !== sig) return null;
  if (Date.now() > Number(expiryStr)) return null;

  try {
    return Buffer.from(emailB64, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}
