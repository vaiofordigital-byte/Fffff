import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

function key() {
  const configured = env().ENCRYPTION_KEY;
  if (!configured) throw new Error("ENCRYPTION_KEY is required for encrypted settings");
  const decoded = Buffer.from(configured, "base64");
  if (decoded.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return decoded;
}

export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decrypt(payload: string) {
  const [ivValue, tagValue, ciphertextValue] = payload.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid ciphertext");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
