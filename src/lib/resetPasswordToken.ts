import { createHmac } from "crypto";

const SECRET = process.env.RESET_PASSWORD_SECRET ?? "reset-pw-default-secret-change-me";
const EXPIRY_MS = 60 * 60 * 1000; // 1시간

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createResetToken(email: string): string {
  const emailB64 = Buffer.from(email).toString("base64url");
  const expiry = Date.now() + EXPIRY_MS;
  const payload = `${emailB64}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyResetToken(token: string): string | null {
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
