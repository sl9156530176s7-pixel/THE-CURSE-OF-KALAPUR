import { useState, useEffect, useCallback, useRef } from 'react';
import { GAME_VERSION, GAME_BUILD_ID } from '../game/version';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface VersionInfo {
  version: string;
  buildId: string;
  releaseDate: string;
  highlights?: string[];
}

export function detectIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;
  const iosStandalone = Boolean((navigator as { standalone?: boolean }).standalone);
  const launchedFromShortcut = new URLSearchParams(window.location.search).get('source') === 'pwa';
  return displayStandalone || iosStandalone || launchedFromShortcut;
}

export function detectIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => detectIsStandalone());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectIsStandalone());
  const [isIOS] = useState<boolean>(() => detectIsIOS());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [swReady, setSwReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [updateStatusMessage, setUpdateStatusMessage] = useState<string>(
    `Installed v${GAME_VERSION} is up to date`
  );

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef(false);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!silent) {
      setCheckingUpdate(true);
      setUpdateStatusMessage('Checking for latest game build...');
    }

    try {
      // 1. Check service worker script updates if supported
      if (registrationRef.current) {
        await registrationRef.current.update().catch(() => {});
        if (registrationRef.current.waiting) {
          setUpdateAvailable(true);
          setUpdateStatusMessage('A new cached update is staged and ready to apply.');
        }
      }

      // 2. Fetch uncached version.json when online
      if (navigator.onLine) {
        const res = await fetch(`./version.json?ts=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const data = (await res.json()) as VersionInfo;
          setRemoteVersion(data.version);
          if (data.version !== GAME_VERSION || data.buildId !== GAME_BUILD_ID) {
            setUpdateAvailable(true);
            setUpdateStatusMessage(`New version v${data.version} available. Reload to update safely.`);
            return;
          }
        }
      }

      if (!registrationRef.current?.waiting) {
        setUpdateStatusMessage(`Running latest version v${GAME_VERSION}. Offline cache ready.`);
      }
    } catch {
      if (!silent) {
        setUpdateStatusMessage(
          navigator.onLine
            ? `Running v${GAME_VERSION}. Unable to reach update server right now.`
            : 'Offline mode active — running locally cached build.'
        );
      }
    } finally {
      if (!silent) {
        setCheckingUpdate(false);
      }
    }
  }, []);

  // Register Service Worker cleanly using relative GitHub Pages path
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void checkForUpdates(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = () => {
      const standaloneNow = detectIsStandalone();
      setIsStandalone(standaloneNow);
      if (standaloneNow) setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener?.('change', handleDisplayChange);

    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('./service-worker.js', {
            scope: './',
          });
          registrationRef.current = reg;
          setSwReady(true);

          if (reg.waiting) {
            setUpdateAvailable(true);
            setUpdateStatusMessage('A new game update is ready. Click Update & Reload.');
          }

          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setUpdateStatusMessage('New version downloaded in background. Reload to apply.');
              }
            });
          });
        } catch {
          // Graceful fallback when running inside restricted preview environments
        }
      };

      void registerSW();

      const handleControllerChange = () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      const interval = window.setInterval(() => {
        void checkForUpdates(true);
      }, 5 * 60 * 1000);

      return () => {
        window.clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
        mediaQuery.removeEventListener?.('change', handleDisplayChange);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', handleDisplayChange);
    };
  }, [checkForUpdates]);

  const promptNativeInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) {
      return 'unavailable';
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return outcome;
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    const waitingWorker = registrationRef.current?.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Fallback reload if controllerchange doesn't fire within 800ms
      window.setTimeout(() => {
        if (!refreshingRef.current) {
          refreshingRef.current = true;
          window.location.reload();
        }
      }, 800);
      return;
    }

    // Fallback safe cache refresh for remote version mismatch
    window.location.reload();
  }, []);

  return {
    canPromptInstall: Boolean(deferredPrompt),
    isStandalone,
    isInstalled,
    isIOS,
    isOnline,
    swReady,
    updateAvailable,
    checkingUpdate,
    remoteVersion,
    updateStatusMessage,
    currentVersion: GAME_VERSION,
    promptNativeInstall,
    checkForUpdates,
    applyUpdate,
  };
}
