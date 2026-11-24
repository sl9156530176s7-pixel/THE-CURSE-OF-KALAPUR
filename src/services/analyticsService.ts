import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, KALAPUR_APP_ID, OperationType, handleFirestoreError } from '../firebase';
import { GAME_VERSION } from '../game/version';

export type DevicePlatform = 'android' | 'ios' | 'desktop' | 'other';
export type InstallEventType =
  | 'pwa_installed'
  | 'install_prompt_accepted'
  | 'install_guide_opened'
  | 'standalone_launch';

export interface DownloadEventRecord {
  id: string;
  appId: string;
  deviceClientId: string;
  platform: DevicePlatform;
  browser: string;
  installType: InstallEventType;
  appVersion: string;
  playerTag?: string;
  createdAtMs: number;
}

export interface PlayerRatingRecord {
  id: string;
  appId: string;
  deviceClientId: string;
  stars: number;
  comment: string;
  playerTag?: string;
  platform: DevicePlatform;
  appVersion: string;
  createdAtMs: number;
}

const DEVICE_ID_KEY = 'kalapur_device_id_v1';
const INSTALL_LOGGED_PREFIX = 'kalapur_install_logged_v1_';

export function getOrCreateDeviceClientId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{6,64}$/.test(existing)) {
      return existing;
    }
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
        : Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
    const created = `dev_${randomPart}`.slice(0, 48);
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return `dev_fallback_${Date.now().toString(36)}`;
  }
}

export function detectDevicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return 'desktop';
  return 'other';
}

export function detectBrowserLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown Browser';
  const ua = navigator.userAgent;
  const platform = detectDevicePlatform();
  if (/Edg\//i.test(ua)) return platform === 'android' ? 'Edge Android' : 'Microsoft Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/CriOS/i.test(ua)) return 'Chrome iOS';
  if (/FxiOS/i.test(ua)) return 'Firefox iOS';
  if (/Firefox\//i.test(ua)) return platform === 'android' ? 'Firefox Android' : 'Firefox';
  if (/Chrome\//i.test(ua)) return platform === 'android' ? 'Chrome Android' : 'Chrome Desktop';
  if (/Safari\//i.test(ua)) return platform === 'ios' ? 'Safari iOS' : 'Safari Desktop';
  return 'Web Browser';
}

function makeDocId(prefix: string, deviceClientId: string, suffix: string): string {
  const cleanSuffix = suffix.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}_${deviceClientId}_${cleanSuffix}`.slice(0, 120);
}

/**
 * Records a privacy-safe PWA install / download / standalone open event in Firestore
 * when online. Deduplicated per device + installType so a user never spams duplicates.
 */
export async function recordInstallEvent(
  installType: InstallEventType,
  playerTag?: string
): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const deviceClientId = getOrCreateDeviceClientId();
  const dedupeKey = `${INSTALL_LOGGED_PREFIX}${installType}`;
  try {
    if (localStorage.getItem(dedupeKey) === '1') {
      return;
    }
  } catch {
    // Ignore storage read blocks
  }

  const docId = makeDocId('dl', deviceClientId, installType);
  const cleanTag = playerTag?.trim().slice(0, 40);
  const path = `downloads/${docId}`;

  try {
    const payload: Record<string, unknown> = {
      appId: KALAPUR_APP_ID,
      deviceClientId,
      platform: detectDevicePlatform(),
      browser: detectBrowserLabel().slice(0, 48),
      installType,
      appVersion: GAME_VERSION.slice(0, 24),
      createdAt: serverTimestamp(),
    };
    if (cleanTag) {
      payload.playerTag = cleanTag;
    }

    await setDoc(doc(db, 'downloads', docId), payload);
    try {
      localStorage.setItem(dedupeKey, '1');
    } catch {
      // Ignore storage quota issues
    }
  } catch (err) {
    // Non-blocking background telemetry: log details without breaking user install flow
    console.warn('Install analytics sync skipped:', path, err);
  }
}

/**
 * Records a player rating & feedback review into Firestore `ratings` when online.
 */
export async function recordPlayerRating(
  stars: number,
  comment: string,
  playerTag?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  const deviceClientId = getOrCreateDeviceClientId();
  const safeStars = Math.max(1, Math.min(5, Math.round(stars)));
  const cleanComment = comment.trim().slice(0, 500);
  const cleanTag = playerTag?.trim().slice(0, 40);
  const docId = makeDocId('rate', deviceClientId, Date.now().toString(36));

  const payload: Record<string, unknown> = {
    appId: KALAPUR_APP_ID,
    deviceClientId,
    stars: safeStars,
    comment: cleanComment,
    platform: detectDevicePlatform(),
    appVersion: GAME_VERSION.slice(0, 24),
    createdAt: serverTimestamp(),
  };
  if (cleanTag) {
    payload.playerTag = cleanTag;
  }

  try {
    await setDoc(doc(db, 'ratings', docId), payload);
    return true;
  } catch (err) {
    console.warn('Rating cloud sync failed:', err);
    return false;
  }
}

function timestampToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    const fn = (val as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') return fn();
  }
  return Date.now();
}

export function subscribeOwnerDownloads(
  onData: (rows: DownloadEventRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'downloads';
  const q = query(
    collection(db, path),
    where('appId', '==', KALAPUR_APP_ID),
    limit(300)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: DownloadEventRecord[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            appId: String(data.appId ?? KALAPUR_APP_ID),
            deviceClientId: String(data.deviceClientId ?? ''),
            platform: (data.platform as DevicePlatform) ?? 'other',
            browser: String(data.browser ?? 'Unknown'),
            installType: (data.installType as InstallEventType) ?? 'pwa_installed',
            appVersion: String(data.appVersion ?? ''),
            playerTag: typeof data.playerTag === 'string' ? data.playerTag : undefined,
            createdAtMs: timestampToMs(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeOwnerRatings(
  onData: (rows: PlayerRatingRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'ratings';
  const q = query(
    collection(db, path),
    where('appId', '==', KALAPUR_APP_ID),
    limit(250)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: PlayerRatingRecord[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            appId: String(data.appId ?? KALAPUR_APP_ID),
            deviceClientId: String(data.deviceClientId ?? ''),
            stars: typeof data.stars === 'number' ? data.stars : 5,
            comment: String(data.comment ?? ''),
            playerTag: typeof data.playerTag === 'string' ? data.playerTag : undefined,
            platform: (data.platform as DevicePlatform) ?? 'other',
            appVersion: String(data.appVersion ?? ''),
            createdAtMs: timestampToMs(data.createdAt),
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function deleteOwnerRecord(
  col: 'downloads' | 'ratings',
  docId: string
): Promise<void> {
  const path = `${col}/${docId}`;
  try {
    await deleteDoc(doc(db, col, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
