/**
 * First/last-touch attribution (same contract as labs.elroi.cloud).
 *
 * `elroi_attr` = {first: Touch, last: Touch}, in localStorage with analytics consent,
 * otherwise in sessionStorage. `first` is set once; `last` is replaced only when the
 * visit carries a campaign parameter or comes from an external referrer.
 */
import { CONSENT_EVENT, hasAnalyticsConsent } from './consent';

export const ATTR_KEY = 'elroi_attr';
export const ATTR_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'] as const;

export type AttrParam = (typeof ATTR_PARAMS)[number];

export type Touch = Partial<Record<AttrParam, string>> & {
  landing_url: string;
  referrer?: string;
  at: string;
};

export interface Attribution {
  first: Touch;
  last: Touch;
}

const safeStorage = (kind: 'localStorage' | 'sessionStorage'): Storage | null => {
  try {
    return window[kind];
  } catch {
    return null;
  }
};

const activeStorage = (): Storage | null => safeStorage(hasAnalyticsConsent() ? 'localStorage' : 'sessionStorage');
const otherStorage = (): Storage | null => safeStorage(hasAnalyticsConsent() ? 'sessionStorage' : 'localStorage');

function parse(raw: string | null | undefined): Attribution | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Attribution;
    return value && value.first && value.last ? value : null;
  } catch {
    return null;
  }
}

export function readAttribution(): Attribution | null {
  return parse(activeStorage()?.getItem(ATTR_KEY)) ?? parse(otherStorage()?.getItem(ATTR_KEY));
}

function write(value: Attribution): void {
  try {
    activeStorage()?.setItem(ATTR_KEY, JSON.stringify(value));
    otherStorage()?.removeItem(ATTR_KEY);
  } catch {
    // Storage full or blocked: attribution is best effort.
  }
}

function externalReferrer(): string | undefined {
  if (!document.referrer) {
    return undefined;
  }
  try {
    return new URL(document.referrer).hostname !== window.location.hostname ? document.referrer : undefined;
  } catch {
    return undefined;
  }
}

/** Runs on every page load. */
export function captureAttribution(): Attribution {
  const url = new URL(window.location.href);
  const touch: Touch = { landing_url: url.href, at: new Date().toISOString() };
  let carriesParams = false;
  ATTR_PARAMS.forEach((param) => {
    const value = url.searchParams.get(param)?.trim();
    if (value) {
      touch[param] = value.slice(0, 500);
      carriesParams = true;
    }
  });
  const referrer = externalReferrer();
  if (referrer) {
    touch.referrer = referrer;
  }

  const stored = readAttribution();
  const next: Attribution = stored
    ? { first: stored.first, last: carriesParams || referrer ? touch : stored.last }
    : { first: touch, last: touch };
  write(next);
  return next;
}

function cookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/** Meta click id: `fb.1.<epoch ms>.<fbclid>` from the last touch, else the _fbc cookie. */
export function metaClickId(attribution: Attribution | null): string | undefined {
  const last = attribution?.last;
  if (last?.fbclid) {
    const time = Date.parse(last.at);
    return `fb.1.${Number.isNaN(time) ? Date.now() : time}.${last.fbclid}`;
  }
  return cookie('_fbc');
}

export const metaBrowserId = (): string | undefined => cookie('_fbp');

export function initAttribution(): void {
  captureAttribution();
  // Consent changed: move the record to the storage that now applies.
  document.addEventListener(CONSENT_EVENT, () => {
    const current = readAttribution();
    if (current) {
      write(current);
    }
  });
}
