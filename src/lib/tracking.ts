/**
 * Public measurement IDs (all optional). With no ID, nothing is loaded and no
 * cookie banner is shown. Same contract as labs.elroi.cloud.
 */
const clean = (value: string | undefined): string => (value ?? '').trim();

export const tracking = {
  ga4Id: clean(import.meta.env.PUBLIC_GA4_ID),
  gtmId: clean(import.meta.env.PUBLIC_GTM_ID),
  metaPixelId: clean(import.meta.env.PUBLIC_META_PIXEL_ID),
  googleSiteVerification: clean(import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION),
};

/** Something that sets cookies is configured, so the consent banner is needed. */
export const consentNeeded = Boolean(tracking.ga4Id || tracking.gtmId || tracking.metaPixelId);
