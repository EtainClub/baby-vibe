import "server-only";

import { createHash, randomInt } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/lib/errors";
import { getAdminDb } from "@/lib/firebase/admin";

// No 0/O/1/I/L — the code gets read off a screen and typed on a phone.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GROUPS = 4;
const GROUP_SIZE = 4;

/** 16 characters from a 31-symbol alphabet ≈ 79 bits. */
function generateCode() {
  const groups: string[] = [];
  for (let group = 0; group < GROUPS; group += 1) {
    let chunk = "";
    for (let index = 0; index < GROUP_SIZE; index += 1) {
      chunk += ALPHABET[randomInt(ALPHABET.length)];
    }
    groups.push(chunk);
  }
  return groups.join("-");
}

export function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function hashCode(code: string) {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

/**
 * Issues a fresh recovery key and invalidates the previous one.
 *
 * The plaintext is returned exactly once and never stored — only its SHA-256
 * lives in `recoveryKeys/{hash}`, a collection no client can read or write.
 */
export async function issueRecoveryKey(uid: string) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const snapshot = await userRef.get();
  if (!snapshot.exists) {
    throw new AppError("profile_not_found", "프로필을 먼저 만들어 주세요.", 404);
  }

  const code = generateCode();
  const hash = hashCode(code);
  const previousHash = snapshot.get("recoveryKeyHash");

  const batch = db.batch();
  if (typeof previousHash === "string" && previousHash !== hash) {
    batch.delete(db.collection("recoveryKeys").doc(previousHash));
  }
  batch.set(db.collection("recoveryKeys").doc(hash), {
    uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(
    userRef,
    {
      recoveryKeyHash: hash,
      recoveryKeyIssuedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();

  return { code };
}

export async function resolveRecoveryKey(code: string) {
  const normalized = normalizeCode(code);
  if (normalized.length !== GROUPS * GROUP_SIZE) {
    throw new AppError("invalid_recovery_key", "복구 키 형식을 확인해 주세요.", 400);
  }

  const snapshot = await getAdminDb()
    .collection("recoveryKeys")
    .doc(hashCode(normalized))
    .get();
  const uid = snapshot.get("uid");
  if (!snapshot.exists || typeof uid !== "string") {
    throw new AppError("recovery_key_not_found", "이 복구 키를 찾을 수 없어요.", 404);
  }
  return uid;
}

export async function hasRecoveryKey(uid: string) {
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  return typeof snapshot.get("recoveryKeyHash") === "string";
}

/** Call when an account is deleted, or the key pointer is orphaned forever. */
export async function deleteRecoveryKey(uid: string) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const hash = (await userRef.get()).get("recoveryKeyHash");
  if (typeof hash !== "string") return;

  const batch = db.batch();
  batch.delete(db.collection("recoveryKeys").doc(hash));
  batch.set(
    userRef,
    { recoveryKeyHash: FieldValue.delete(), recoveryKeyIssuedAt: FieldValue.delete() },
    { merge: true },
  );
  await batch.commit();
}
