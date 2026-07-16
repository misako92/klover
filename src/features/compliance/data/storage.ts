import { createSeedDb } from "./seed";
import type { LocalDb } from "./types";
import { DB_VERSION, STORAGE_KEY } from "./types";

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isDbShape(value: unknown): value is LocalDb {
  if (!value || typeof value !== "object") return false;
  const candidate = value as LocalDb;
  return (
    candidate.version === DB_VERSION &&
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.imports) &&
    Array.isArray(candidate.declarations) &&
    typeof candidate.settings === "object"
  );
}

export function readLocalDb(): LocalDb {
  if (!hasWindow()) {
    return createSeedDb();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedDb();
    writeLocalDb(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isDbShape(parsed)) {
      const seed = createSeedDb();
      writeLocalDb(seed);
      return seed;
    }
    return parsed;
  } catch {
    const seed = createSeedDb();
    writeLocalDb(seed);
    return seed;
  }
}

export function writeLocalDb(db: LocalDb) {
  if (!hasWindow()) {
    return db;
  }

  const nextDb: LocalDb = {
    ...db,
    version: DB_VERSION,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDb));
  return nextDb;
}

export function resetLocalDb() {
  const seed = createSeedDb();
  writeLocalDb(seed);
  return seed;
}
