/**
 * Manage-tokens live only in this browser's localStorage — there's no account
 * system to attach them to. Every read/write fails soft (private browsing,
 * disabled storage) rather than throwing: losing manage-access is an accepted
 * MVP limitation, not a crash (see specs/outputs/prd-share-2026-09-12.md).
 */
const STORAGE_KEY = "share-manage-tokens";

function readAll(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveManageToken(token: string, manageToken: string): void {
  try {
    const all = readAll();
    all[token] = manageToken;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Fails soft — the share still succeeded, the PM just can't manage it from this browser.
  }
}

export function getManageToken(token: string): string | null {
  return readAll()[token] ?? null;
}

export function removeManageToken(token: string): void {
  try {
    const all = readAll();
    delete all[token];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Nothing to do — see saveManageToken.
  }
}
