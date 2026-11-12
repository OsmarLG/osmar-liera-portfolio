export type Lang = 'es' | 'en';

export type StepKey = 'request' | 'agent' | 'tools' | 'approval' | 'result';

export interface NavItem {
  id: string;
  label: string;
  /** Page link instead of an in-page anchor on the home page (e.g. "/blog/"). */
  href?: string;
}

export interface ServiceItem {
  name: string;
  text: string;
}

/** A real piece shown on the home. `piece` is a key of src/data/showcase.json (built by scripts/media/build-showcase.mjs). */
export interface ShowcasePiece {
  piece: string;
  kind: 'video' | 'image';
  /** What the piece shows, for screen readers. */
  alt: string;
  /** One visible line under the piece. */
  caption: string;
}

/** One service with one real piece and one line. */
export interface ServiceCardItem {
  key: string;
  name: string;
  line: string;
  media: ShowcasePiece;
}

/** Row of @soyosmarlg reels and carousel covers right after the hero (Spanish home only). */
export interface ShowcaseSection {
  id: string;
  kicker: string;
  title: string;
  intro: string;
  /** Accessible name of the scrollable row. */
  rowLabel: string;
  prev: string;
  next: string;
  reels: { piece: string; title: string }[];
  carouselsTitle: string;
  carousels: ShowcasePiece[];
  follow: string;
}

/** Personal-brand services block (Spanish home only). */
export interface ServicesSection {
  kicker: string;
  title: string;
  intro: string;
  audience: string;
  diagnostic: { label: string; name: string; text: string; bullets: string[]; cta: string; whatsappMessage: string };
  implementations: { label: string; name: string; text: string; items: ServiceItem[] };
  /** The five implementations as cards, each with a real piece. */
  cards: ServiceCardItem[];
  monthly: { label: string; name: string; text: string; bullets: string[]; note: string };
  cta: string;
  whatsappMessage: string;
}

/** One step of the pinned "how I work" walkthrough. */
export interface ProcessStep {
  key: string;
  /** Short name for the progress rail. */
  short: string;
  label: string;
  title: string;
  text: string;
  meta: string;
  /** Terminal-style log lines shown with the step. */
  log: string[];
}

/** Pinned scrollytelling block: diagnosis → implementation → follow-up (Spanish home only). */
export interface ProcessSection {
  id: string;
  kicker: string;
  title: string;
  intro: string;
  steps: ProcessStep[];
}

export type QuizServiceKey = 'diagnostico' | 'redes' | 'web' | 'tienda' | 'automatizacion' | 'sistema' | 'asesoria';

export interface QuizOption {
  value: string;
  label: string;
  /** Wording used in the summary and the WhatsApp message. */
  short?: string;
  /** Points each answer gives to the services it points to. */
  scores: Partial<Record<QuizServiceKey, number>>;
}

export interface QuizQuestion {
  key: string;
  legend: string;
  hint?: string;
  summaryLabel: string;
  options: QuizOption[];
}

/** "Diagnóstico en 30 segundos": 4 questions that recommend one real service (Spanish home only). */
export interface QuizSection {
  id: string;
  kicker: string;
  title: string;
  intro: string;
  promise: string[];
  file: string;
  progress: string;
  next: string;
  back: string;
  seeResult: string;
  restart: string;
  required: string;
  resultLabel: string;
  resultLead: string;
  firstStep: string;
  firstStepDiagnostic: string;
  summaryTitle: string;
  cta: string;
  messageIntro: string;
  /** "{service}" is replaced with the recommended service. */
  messageOutro: string;
  fallback: string;
  fallbackCta: string;
  fallbackMessage: string;
  /** Tie-break order: the first service wins a tie. */
  order: QuizServiceKey[];
  results: Record<QuizServiceKey, { name: string; why: string }>;
  questions: QuizQuestion[];
}

/** Recent posts block on the home page (Spanish home only). */
export interface BlogTeaser {
  kicker: string;
  title: string;
  intro: string;
  cta: string;
}

export interface ConsentCopy {
  title: string;
  text: string;
  accept: string;
  necessary: string;
  configure: string;
  save: string;
  necessaryLabel: string;
  necessaryText: string;
  analytics: string;
  analyticsText: string;
  ads: string;
  adsText: string;
  privacy: string;
  dialogLabel: string;
}

export interface Signal {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface RunLine {
  step: StepKey;
  label: string;
  text: string;
  state?: 'ok' | 'wait' | 'done';
}

export interface Role {
  org: string;
  role: string;
  place?: string;
  summary: string;
}

export type DiagramNodeKind = 'default' | 'gate' | 'store' | 'model';

export interface DiagramColumn {
  label: string;
  nodes: { title: string; detail?: string; kind?: DiagramNodeKind }[];
}

export interface AiCase {
  id: string;
  index: string;
  context: string;
  title: string;
  summary: string;
  bullets: string[];
  tags: string[];
  /** Screenshot or screen recording shown above the diagram, when an honest one exists. */
  media?: ShowcasePiece;
  diagramTitle: string;
  diagramSummary: string;
  diagram: DiagramColumn[];
}

export interface Principle {
  title: string;
  text: string;
}

export interface ExperienceProject {
  name: string;
  summary: string;
  bullets: string[];
  caseLink?: { href: string; label: string };
}

export interface ExperienceOrg {
  org: string;
  role: string;
  place?: string;
  period: string;
  summary: string;
  projects: ExperienceProject[];
}

export interface PreviousRole {
  org: string;
  role: string;
  period: string;
  summary: string;
}

export interface CommerceSite {
  name: string;
  market: string;
  marketLabel: string;
  href: string;
  domain: string;
}

export type ProjectImageKey =
  | 'pmcrm-dashboard'
  | 'avt-map'
  | 'avt-satellite'
  | 'nopalgreen-landing'
  | 'nopalgreen-pos';

export interface Product {
  name: string;
  tagline: string;
  summary: string;
  features: string[];
  stack: string[];
  stackNote: string;
  /** Public repository; omitted for private products. */
  repo?: string;
  repoLabel?: string;
  /** Shown instead of the repository link, e.g. "Private · in production". */
  status?: string;
  images: { key: ProjectImageKey; alt: string; label: string }[];
  /** Architecture map shown instead of screenshots (private products). */
  diagram?: { title: string; summary: string; columns: DiagramColumn[] };
}

export interface StackItem {
  tech: string;
  evidence: string[];
}

export interface StackGroup {
  id: string;
  label: string;
  items: StackItem[];
}

export interface CvDownload {
  file: string;
  title: string;
  description: string;
  lang: Lang;
  langLabel: string;
  size: string;
}

export interface CvSkillRow {
  label: string;
  value: string;
}

export interface CvExperienceBlock {
  role: string;
  org: string;
  place?: string;
  period: string;
  summary: string;
  projects: { name: string; context: string; bullets: string[] }[];
}

export interface Dictionary {
  lang: Lang;
  htmlLang: string;
  ogLocale: string;
  ogLocaleAlternate: string;
  paths: { home: string; cv: string };
  altPaths: { home: string; cv: string };
  meta: {
    homeTitle: string;
    homeDescription: string;
    cvTitle: string;
    cvDescription: string;
    ogAlt: string;
    ogImage: string;
  };
  ui: {
    skip: string;
    navLabel: string;
    menuOpen: string;
    menuClose: string;
    switchLang: string;
    switchLangShort: string;
    switchLangName: string;
    newTab: string;
    brandHome: string;
    cv: string;
    cvLabel: string;
    present: string;
    enlarge: string;
    close: string;
    imageDialog: string;
    viewRepo: string;
    visitSite: string;
    footerNote: string;
    footerBuilt: string;
    backToTop: string;
    steps: Record<StepKey, string>;
    stackTabsLabel: string;
    evidence: string;
    technology: string;
    pauseAnimation: string;
    playAnimation: string;
    playVideo: string;
    pauseVideo: string;
    downloadPdf: string;
    contributionLabel: string;
    blog: string;
    privacy: string;
    cookiePrefs: string;
  };
  nav: NavItem[];
  ids: {
    profile: string;
    cases: string;
    principles: string;
    experience: string;
    products: string;
    stack: string;
    contact: string;
    services: string;
    blog: string;
  };
  hero: {
    prompt: string;
    promptLabel: string;
    role: string;
    roleSub: string;
    lead: string;
    location: string;
    availability: string;
    ctaCases: string;
    ctaCv: string;
    ctaWhatsapp: string;
    /** Personal-brand hero: WhatsApp first, then services; no CV button. */
    ctaServices?: string;
    photoAlt: string;
    detectionLabel: string;
  };
  run: {
    title: string;
    caption: string;
    lines: RunLine[];
  };
  signalsLabel: string;
  signals: Signal[];
  profile: {
    kicker: string;
    title: string;
    paragraphs: string[];
    rolesTitle: string;
    roles: Role[];
    languagesTitle: string;
    languages: { name: string; level: string }[];
  };
  cases: {
    kicker: string;
    title: string;
    intro: string;
    items: AiCase[];
  };
  principles: {
    kicker: string;
    title: string;
    intro: string;
    items: Principle[];
    approval: {
      tool: string;
      meta: string;
      waiting: string;
      approved: string;
      approve: string;
      edit: string;
    };
  };
  experience: {
    kicker: string;
    title: string;
    intro: string;
    orgs: ExperienceOrg[];
    previousTitle: string;
    previous: PreviousRole[];
  };
  commerce: {
    title: string;
    text: string;
    note: string;
    sites: CommerceSite[];
  };
  products: {
    title: string;
    intro: string;
    items: Product[];
  };
  stack: {
    title: string;
    intro: string;
    groups: StackGroup[];
  };
  contact: {
    kicker: string;
    title: string;
    text: string;
    whatsappMessage: string;
    whatsapp: string;
    email: string;
    phoneLabel: string;
    emailLabel: string;
    cvTitle: string;
    cvText: string;
    cvCta: string;
  };
  /** Present only on the personal-brand (Spanish) home. */
  services?: ServicesSection;
  showcase?: ShowcaseSection;
  process?: ProcessSection;
  quiz?: QuizSection;
  blogTeaser?: BlogTeaser;
  consent: ConsentCopy;
  cvPage: {
    kicker: string;
    title: string;
    subtitle: string;
    downloadsTitle: string;
    downloadsIntro: string;
    downloads: CvDownload[];
    summaryTitle: string;
    summary: string[];
    skillsTitle: string;
    skills: CvSkillRow[];
    experienceTitle: string;
    experience: CvExperienceBlock[];
    teachingTitle: string;
    teaching: { role: string; org: string; period: string; bullets: string[] };
    previousTitle: string;
    previous: PreviousRole[];
    educationTitle: string;
    education: string;
    productsTitle: string;
    products: { name: string; text: string; repo?: string }[];
    languagesTitle: string;
    languages: string[];
    closing: string;
    contactTitle: string;
    backHome: string;
    printHint: string;
  };
}
