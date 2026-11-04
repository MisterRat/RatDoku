import { useSyncExternalStore } from 'react';

// Tracks whether RatDoku can be installed as an app on this device, for the
// "Install App" option in Settings. Imported from main.tsx so it starts listening
// before the browser fires its install event.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * 'prompt' – the browser offers installation (Chrome, Edge, Samsung Internet…)
 * 'ios'    – iPhone/iPad: no install button exists, the player uses Share → Add to Home Screen
 * 'none'   – already installed, running from the standalone RatDoku.html, or not installable
 */
export type InstallState = 'prompt' | 'ios' | 'none';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  // Not calling preventDefault(): the browser keeps showing its own install hints too.
  window.addEventListener('beforeinstallprompt', (event) => {
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function isRunningAsApp(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

function isAppleMobile(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function getInstallState(): InstallState {
  if (typeof window === 'undefined') return 'none';
  if (import.meta.env.MODE === 'singlefile' || !window.isSecureContext) return 'none';
  if (installed || isRunningAsApp()) return 'none';
  if (deferredPrompt) return 'prompt';
  if (isAppleMobile()) return 'ios';
  return 'none';
}

/** Shows the browser's install dialog. Resolves true if the player accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt;
  if (!event) return false;
  deferredPrompt = null; // each event can only be used once
  notify();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome === 'accepted';
  } catch {
    return false;
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getInstallState, () => 'none');
}
