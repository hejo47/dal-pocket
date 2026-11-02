"use client";

import { createDemoData, isPocketData, normalizePocketData, todayInSeoul } from "@/lib/pocket";
import type { PocketData } from "@/lib/pocket";
import type { PocketPacket } from "@/lib/pocket-api";

type StorageState = "local" | "connecting" | "syncing" | "synced" | "error" | "conflict";
type Snapshot = { data: PocketData; today: string; ready: boolean; storage: StorageState };
type SyncMeta = { revision: number | null; dirty: boolean };
const KEY = "dal-pocket-v1";
const META_KEY = "dal-pocket-sync-v1";
const serverSnapshot: Snapshot = { data: createDemoData("2000-01-01"), today: "2000-01-01", ready: false, storage: "local" };
let snapshot: Snapshot | undefined;
let cloudStarted = false;
let cloudEnabled = false;
let cloudRevision: number | null = null;
let pending: PocketData | null = null;
let flushing = false;
let refreshing = false;
let syncMeta: SyncMeta = { revision: null, dirty: false };
const listeners = new Set<() => void>();

export function getServerSnapshot() { return serverSnapshot; }

export function getLocalData() { return getSnapshot().data; }

export function adoptCloudPacket(packet: PocketPacket) {
  cloudEnabled = true;
  cloudRevision = packet.revision;
  pending = null;
  syncMeta = { revision: packet.revision, dirty: false };
  snapshot = { ...getSnapshot(), data: packet.data ?? createDemoData(todayInSeoul()), storage: "synced" };
  persist();
  emit();
}

export function clearLocalPocket() {
  const today = todayInSeoul();
  pending = null;
  cloudEnabled = false;
  cloudRevision = null;
  syncMeta = { revision: null, dirty: false };
  snapshot = { data: createDemoData(today), today, ready: true, storage: "local" };
  persist();
  emit();
}

export function getSnapshot(): Snapshot {
  if (snapshot) return snapshot;
  const today = todayInSeoul();
  let data = createDemoData(today);
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      const normalized = normalizePocketData(parsed);
      if (normalized) {
        data = normalized;
        syncMeta = { revision: null, dirty: !data.isDemo };
        const meta = JSON.parse(window.localStorage.getItem(META_KEY) ?? "null") as SyncMeta | null;
        if (meta && (meta.revision === null || Number.isSafeInteger(meta.revision) && meta.revision >= 0) && typeof meta.dirty === "boolean") syncMeta = meta;
      }
    }
  } catch { /* Keep the page usable when browser storage is unavailable. */ }
  snapshot = { data, today, ready: true, storage: cloudStarted ? "connecting" : "local" };
  return snapshot;
}

function emit() { listeners.forEach((listener) => listener()); }

function setStorage(storage: StorageState) {
  snapshot = { ...getSnapshot(), storage };
  emit();
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(getSnapshot().data));
    window.localStorage.setItem(META_KEY, JSON.stringify(syncMeta));
    return true;
  } catch { return false; }
}

async function readCloud() {
  const response = await fetch("/api/pocket", { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    const error = await response.json();
    if (error.code === "DATABASE_NOT_CONFIGURED") return null;
    throw new Error("DATABASE_UNAVAILABLE");
  }
  const packet: PocketPacket = await response.json();
  if (!Number.isSafeInteger(packet.revision) || packet.revision < 0 || packet.data !== null && (!isPocketData(packet.data) || packet.data.isDemo)) throw new Error("INVALID_SERVER_DATA");
  return packet;
}

async function flushCloud() {
  if (!cloudEnabled || cloudRevision === null || flushing) return;
  flushing = true;
  try {
    while (pending) {
      const target = pending;
      pending = null;
      setStorage("syncing");
      try {
        const response = await fetch("/api/pocket", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: target, revision: cloudRevision }), signal: AbortSignal.timeout(15000) });
        if (!response.ok) {
          pending ??= target;
          setStorage(response.status === 409 ? "conflict" : "error");
          return;
        }
        const packet: PocketPacket = await response.json();
        if (packet.revision !== cloudRevision + 1) throw new Error("INVALID_SERVER_REVISION");
        cloudRevision = packet.revision;
        syncMeta = { revision: cloudRevision, dirty: pending !== null };
        persist();
      } catch {
        pending ??= target;
        setStorage("error");
        return;
      }
    }
    setStorage("synced");
  } finally { flushing = false; }
}

export async function retryCloud(options: { silent?: boolean } = {}) {
  if (flushing || refreshing) return;
  refreshing = true;
  if (!options.silent) setStorage("connecting");
  try {
    const packet = await readCloud();
    if (!packet) { cloudEnabled = false; setStorage("local"); return; }
    if (flushing || cloudRevision !== null && packet.revision < cloudRevision) return;
    cloudEnabled = true;
    cloudRevision = packet.revision;
    const current = getSnapshot();
    if (packet.data && syncMeta.dirty && !current.data.isDemo && syncMeta.revision !== packet.revision) {
      setStorage("conflict");
      return;
    }
    if (packet.data && !syncMeta.dirty) {
      snapshot = { ...current, data: { ...packet.data, mode: current.data.mode }, storage: "synced" };
      syncMeta = { revision: packet.revision, dirty: false };
      persist();
      emit();
    } else if (!current.data.isDemo) {
      pending = current.data;
      await flushCloud();
    } else if (packet.data) {
      snapshot = { ...current, data: { ...packet.data, mode: current.data.mode }, storage: "synced" };
      syncMeta = { revision: packet.revision, dirty: false };
      persist();
      emit();
    } else { setStorage("synced"); }
  } catch { setStorage("error"); }
  finally { refreshing = false; }
}

export async function loadServerCopy() {
  if (flushing) return;
  try {
    const packet = await readCloud();
    if (!packet?.data) { setStorage("error"); return; }
    // Preserve the local copy before replacing it after an explicit user action.
    window.localStorage.setItem("dal-pocket-local-backup", JSON.stringify(getSnapshot().data));
    pending = null;
    cloudEnabled = true;
    cloudRevision = packet.revision;
    syncMeta = { revision: packet.revision, dirty: false };
    snapshot = { ...getSnapshot(), data: packet.data, storage: "synced" };
    persist();
    emit();
  } catch { setStorage("error"); }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!cloudStarted) { cloudStarted = true; void retryCloud(); }
  const onStorage = (event: StorageEvent) => {
    if (event.key === META_KEY || event.key === null) {
      if (flushing || pending) return;
      snapshot = undefined;
      getSnapshot();
      emit();
      void retryCloud();
    }
  };
  const onFocus = () => {
    const current = getSnapshot();
    const today = todayInSeoul();
    if (today !== current.today) { snapshot = { ...current, today }; emit(); }
    if (document.visibilityState === "visible" && cloudEnabled && current.storage !== "conflict") void retryCloud({ silent: true });
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onFocus);
  window.addEventListener("online", onFocus);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onFocus);
    window.removeEventListener("online", onFocus);
  };
}

export function updatePocket(updater: (current: PocketData) => PocketData, options: { sync?: boolean } = {}) {
  const shouldSync = options.sync !== false;
  const current = getSnapshot();
  const data = updater(current.data);
  if (!isPocketData(data)) throw new Error("저장할 내용을 확인해주세요.");
  snapshot = { ...current, data, today: todayInSeoul() };
  if (shouldSync) syncMeta = { ...syncMeta, dirty: !data.isDemo };
  const persisted = persist();
  emit();
  if (shouldSync && !data.isDemo && cloudEnabled && current.storage !== "conflict" && current.storage !== "error") {
    pending = data;
    void flushCloud();
  }
  return persisted;
}
