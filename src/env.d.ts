interface ImportMetaEnv {
  /** Google Analytics 4 measurement ID (G-XXXXXXXXXX). */
  readonly PUBLIC_GA4_ID?: string;
  /** Google Tag Manager container ID (GTM-XXXXXXX). */
  readonly PUBLIC_GTM_ID?: string;
  /** Meta Pixel ID; loaded only after advertising consent. */
  readonly PUBLIC_META_PIXEL_ID?: string;
  /** Google Search Console verification token. */
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
