export type Lang = 'es' | 'en';

export type StepKey = 'request' | 'agent' | 'tools' | 'approval' | 'result';

export interface NavItem {
  id: string;
  label: string;
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
    downloadPdf: string;
    contributionLabel: string;
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
