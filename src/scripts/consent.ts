/**
 * Cookie consent (Google Consent Mode v2). The consent default ("denied") and any
 * stored choice are applied inline in <head> before gtag/GTM load (Analytics.astro);
 * this module runs the banner, stores new choices and loads Meta Pixel only with
 * advertising consent.
 *
 * localStorage `elroi_consent` = {"v":1,"analytics":bool,"ads":bool,"at":ISO}
 */
export const CONSENT_KEY = 'elroi_consent';
export const CONSENT_EVENT = 'elroi:consent';

export interface Consent {
  v: 1;
  analytics: boolean;
  ads: boolean;
  at: string;
}

export function readConsent(): Consent | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? 'null') as Partial<Consent> | null;
    if (value && value.v === 1 && typeof value.analytics === 'boolean' && typeof value.ads === 'boolean') {
      return { v: 1, analytics: value.analytics, ads: value.ads, at: String(value.at ?? '') };
    }
  } catch {
    // Storage blocked or corrupted: treated as "no choice yet".
  }
  return null;
}

export const hasAnalyticsConsent = (): boolean => readConsent()?.analytics === true;

const grant = (allowed: boolean): 'granted' | 'denied' => (allowed ? 'granted' : 'denied');

function applyToGoogle(consent: Consent): void {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: grant(consent.analytics),
      ad_storage: grant(consent.ads),
      ad_user_data: grant(consent.ads),
      ad_personalization: grant(consent.ads),
    });
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: 'consent_update', analytics: consent.analytics, ads: consent.ads });
}

/** Standard Meta Pixel bootstrap, run only after advertising consent. */
function loadMetaPixel(pixelId: string): void {
  if (!pixelId) {
    return;
  }
  if (window.fbq) {
    window.fbq('consent', 'grant');
    return;
  }
  const queue: unknown[] = [];
  const fbq = function (...args: unknown[]): void {
    if (fbq.callMethod) {
      (fbq.callMethod as (...inner: unknown[]) => void)(...args);
    } else {
      queue.push(args);
    }
  } as NonNullable<Window['fbq']>;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = queue;
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', pixelId);
  fbq('track', 'PageView');
}

function applyAds(consent: Consent): void {
  const pixelId = (import.meta.env.PUBLIC_META_PIXEL_ID ?? '').trim();
  if (consent.ads) {
    loadMetaPixel(pixelId);
  } else if (window.fbq) {
    window.fbq('consent', 'revoke');
  }
}

export function saveConsent(analytics: boolean, ads: boolean): Consent {
  const consent: Consent = { v: 1, analytics, ads, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Without storage the choice only lasts for this page view.
  }
  applyToGoogle(consent);
  applyAds(consent);
  document.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: consent }));
  return consent;
}

/** Banner behaviour: shown when there is no stored choice; the footer link reopens it. */
export function initConsent(): void {
  const stored = readConsent();
  if (stored) {
    applyAds(stored);
  }

  const banner = document.querySelector<HTMLElement>('[data-consent]');
  if (!banner) {
    return;
  }
  const settings = banner.querySelector<HTMLElement>('[data-consent-settings]');
  const analyticsToggle = banner.querySelector<HTMLInputElement>('[data-consent-analytics]');
  const adsToggle = banner.querySelector<HTMLInputElement>('[data-consent-ads]');
  const configureButton = banner.querySelector<HTMLButtonElement>('[data-consent-configure]');
  const saveButton = banner.querySelector<HTMLButtonElement>('[data-consent-save]');
  let opener: HTMLElement | null = null;

  const showSettings = (show: boolean): void => {
    if (settings) {
      settings.hidden = !show;
    }
    if (saveButton) {
      saveButton.hidden = !show;
    }
    if (configureButton) {
      configureButton.hidden = show;
      configureButton.setAttribute('aria-expanded', String(show));
    }
  };

  const open = (withSettings: boolean): void => {
    const current = readConsent();
    if (analyticsToggle) {
      analyticsToggle.checked = current?.analytics ?? false;
    }
    if (adsToggle) {
      adsToggle.checked = current?.ads ?? false;
    }
    showSettings(withSettings);
    banner.hidden = false;
  };

  const close = (): void => {
    banner.hidden = true;
    opener?.focus();
    opener = null;
  };

  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => {
    saveConsent(true, true);
    close();
  });
  banner.querySelector('[data-consent-necessary]')?.addEventListener('click', () => {
    saveConsent(false, false);
    close();
  });
  configureButton?.addEventListener('click', () => {
    showSettings(true);
    analyticsToggle?.focus();
  });
  saveButton?.addEventListener('click', () => {
    saveConsent(analyticsToggle?.checked ?? false, adsToggle?.checked ?? false);
    close();
  });

  document.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-consent-open]');
    if (trigger) {
      event.preventDefault();
      opener = trigger;
      open(true);
      banner.querySelector<HTMLElement>('[data-consent-title]')?.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !banner.hidden && readConsent()) {
      close();
    }
  });

  if (!stored) {
    open(false);
  }
}
