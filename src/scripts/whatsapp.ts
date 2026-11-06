/**
 * Tracked WhatsApp links. Every `a[data-wa]` keeps a plain wa.me href (no-JS fallback);
 * on click its href is rebuilt to https://labs.elroi.cloud/wa with the attribution,
 * which registers the click in the CRM and redirects to WhatsApp.
 */
import { track, SITE_KEY } from './analytics';
import { ATTR_PARAMS, metaBrowserId, metaClickId, readAttribution } from './attribution';

export const WA_ENDPOINT = 'https://labs.elroi.cloud/wa';

function base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function trackedWhatsAppHref(message: string): string {
  const attribution = readAttribution();
  const last = attribution?.last;
  const query = new URLSearchParams();
  const set = (key: string, value: string | undefined): void => {
    if (value) {
      query.set(key, value);
    }
  };

  set('site', SITE_KEY);
  set('m', message);
  set('page', window.location.href);
  ATTR_PARAMS.forEach((param) => set(param, last?.[param]));
  set('fbc', metaClickId(attribution));
  set('fbp', metaBrowserId());
  set('lp', last?.landing_url);
  set('rf', last?.referrer);
  if (attribution?.first) {
    set('ft', base64Url(JSON.stringify(attribution.first)));
  }
  return `${WA_ENDPOINT}?${query.toString()}`;
}

function sectionOf(link: HTMLElement): string {
  return link.dataset.waLocation || link.closest<HTMLElement>('section[id], [data-wa-section]')?.id || 'pagina';
}

function onActivate(event: MouseEvent): void {
  if (event.type === 'auxclick' && event.button !== 1) {
    return;
  }
  const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-wa]');
  if (!link) {
    return;
  }
  link.href = trackedWhatsAppHref(link.dataset.waMessage ?? '');
  link.target = '_blank';

  const location = sectionOf(link);
  track('whatsapp_click', { location });
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Contact');
  }
}

export function initWhatsAppLinks(): void {
  document.addEventListener('click', onActivate);
  document.addEventListener('auxclick', onActivate);
}
