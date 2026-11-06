/**
 * Tiny shared measurement helper (same contract as labs.elroi.cloud).
 * Everything is a no-op when no tag is configured, apart from the dataLayer push.
 */
export const SITE_KEY = 'osmarlg';

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

/** Pushes `{event: name, ...params, site}` to the dataLayer and sends the same event to GA4 (gtag). */
export function track(name: string, params: Params = {}): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...params, site: SITE_KEY });
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
