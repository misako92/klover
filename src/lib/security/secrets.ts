import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ENCRYPTION_PREFIX = "enc:v1";

function getEncryptionKey() {
  const raw = process.env.KLOVER_ENCRYPTION_KEY?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing KLOVER_ENCRYPTION_KEY");
    }
    return null;
  }

  const candidates = [Buffer.from(raw, "base64"), Buffer.from(raw, "hex"), Buffer.from(raw)];
  const key = candidates.find((candidate) => candidate.length === 32);

  if (!key) {
    throw new Error("KLOVER_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function encryptSecret(value?: null | string) {
  if (!value) {
    return null;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}:${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSecret(value?: null | string) {
  if (!value) {
    return null;
  }

  if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    throw new Error("Encrypted secret cannot be decrypted without KLOVER_ENCRYPTION_KEY");
  }

  const rawPayload = value.slice(`${ENCRYPTION_PREFIX}:`.length);
  const [ivPart, authTagPart, payloadPart, ...rest] = rawPayload.split(":");
  if (!ivPart || !authTagPart || !payloadPart || rest.length > 0) {
    throw new Error("Invalid encrypted secret payload");
  }

  const iv = Buffer.from(ivPart, "base64url");
  const authTag = Buffer.from(authTagPart, "base64url");
  const payload = Buffer.from(payloadPart, "base64url");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(payload), decipher.final()]).toString("utf8");
}
