import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Code2,
  Cloud,
  Database,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Globe2,
  Languages,
  Layers3,
  ContactRound,
  Mail,
  Menu,
  MessageCircle,
  Server,
  Sparkles,
  X,
} from 'lucide-react'

type Locale = 'es' | 'en'

type Localized = {
  es: string
  en: string
}

type Project = {
  number: string
  name: string
  eyebrow: Localized
  summary: Localized
  details: Localized[]
  stack: string[]
  images: { src: string; alt: Localized; label: Localized }[]
  repo: string
  tone: 'blue' | 'orange' | 'green'
}

const projects: Project[] = [
  {
    number: '01',
    name: 'PMCRM',
    eyebrow: { es: 'Gestión operativa personal', en: 'Personal operations platform' },
    summary: {
      es: 'Un espacio central para administrar proyectos, archivos, notas, clientes, permisos y colaboración sin fragmentar la operación entre herramientas.',
      en: 'A central workspace for projects, files, notes, customers, permissions and collaboration—without scattering operations across tools.',
    },
    details: [
      { es: 'Gestión de proyectos y clientes', en: 'Project and customer management' },
      { es: 'Archivos, notas y almacenamiento', en: 'Files, notes and storage' },
      { es: 'Roles, permisos y actividad', en: 'Roles, permissions and activity' },
    ],
    stack: ['Laravel', 'React', 'TypeScript', 'MySQL', 'Vite'],
    images: [
      {
        src: '/images/pmcrm-dashboard.png',
        alt: { es: 'Dashboard oscuro de PMCRM', en: 'PMCRM dark dashboard' },
        label: { es: 'Dashboard', en: 'Dashboard' },
      },
    ],
    repo: 'https://github.com/OsmarLG/pm-crm-elroi',
    tone: 'blue',
  },
  {
    number: '02',
    name: 'AVT',
    eyebrow: { es: 'SaaS inmobiliario multitenant', en: 'Multi-tenant real estate SaaS' },
    summary: {
      es: 'Plataforma para administrar venta de terrenos por organización: predios georreferenciados, personas, ventas, zonas, reportes y control de usuarios.',
      en: 'A multi-organization land sales platform with georeferenced lots, people, sales, zones, reports and user management.',
    },
    details: [
      { es: 'Mapa y vista satelital de predios', en: 'Map and satellite lot views' },
      { es: 'Aislamiento por organización', en: 'Tenant-aware data isolation' },
      { es: 'Ventas, personas y reportes', en: 'Sales, people and reporting' },
    ],
    stack: ['Laravel 12', 'React', 'TypeScript', 'Google Maps', 'MySQL'],
    images: [
      {
        src: '/images/avt-map.png',
        alt: { es: 'Mapa de predios en AVT', en: 'AVT lot map' },
        label: { es: 'Mapa', en: 'Map' },
      },
      {
        src: '/images/avt-satellite.png',
        alt: { es: 'Vista satelital de predios en AVT', en: 'AVT satellite lot view' },
        label: { es: 'Satélite', en: 'Satellite' },
      },
    ],
    repo: 'https://github.com/OsmarLG/api-avt-l12',
    tone: 'orange',
  },
  {
    number: '03',
    name: 'NopalGreen',
    eyebrow: { es: 'Operación para tortillerías', en: 'Operations for tortilla businesses' },
    summary: {
      es: 'Sistema integral para conectar ventas, punto de venta, producción, inventario, reparto, asistencia, finanzas y reportes en una sola operación.',
      en: 'An integrated system connecting sales, POS, production, inventory, delivery, attendance, finance and reporting in one operation.',
    },
    details: [
      { es: 'POS y control de ventas', en: 'POS and sales control' },
      { es: 'Producción, inventario y reparto', en: 'Production, inventory and delivery' },
      { es: 'Asistencia, finanzas y auditoría', en: 'Attendance, finance and auditing' },
    ],
    stack: ['Laravel', 'React', 'TypeScript', 'MySQL', 'TailwindCSS'],
    images: [
      {
        src: '/images/nopalgreen-landing.png',
        alt: { es: 'Página principal de NopalGreen', en: 'NopalGreen landing page' },
        label: { es: 'Producto', en: 'Product' },
      },
      {
        src: '/images/nopalgreen-pos.png',
        alt: { es: 'Punto de venta de NopalGreen', en: 'NopalGreen point of sale' },
        label: { es: 'Punto de venta', en: 'Point of sale' },
      },
    ],
    repo: 'https://github.com/OsmarLG/nopalgreen',
    tone: 'green',
  },
]

const copy = {
  es: {
    nav: ['Inicio', 'Productos', 'Experiencia', 'Stack', 'Contacto'],
    navIds: ['inicio', 'productos', 'experiencia', 'stack', 'contacto'],
    status: 'Disponible para oportunidades remotas e híbridas',
    intro: 'Hola, soy',
    role: 'Backend / Full-Stack Engineer',
    hero: 'Diseño sistemas que conectan operación, datos y producto.',
    heroBody: 'Construyo APIs, SaaS multitenant, automatizaciones y experiencias web con Python, FastAPI, Laravel, React y TypeScript.',
    seeWork: 'Ver productos',
    contact: 'Hablemos',
    ownProducts: 'Productos propios',
    ownTitle: 'Software nacido de problemas reales.',
    ownBody: 'Tres productos personales que combinan arquitectura, dominio de negocio y diseño de interfaces. Cada uno resuelve una operación distinta.',
    viewRepo: 'Ver repositorio',
    enlarge: 'Ampliar captura',
    professional: 'Experiencia profesional',
    professionalTitle: 'E-commerce en dos mercados.',
    professionalBody: 'Trabajo realizado como parte del equipo de Nuts Marketing. La propiedad de marca y producto corresponde a Shasa.',
    mx: 'E-commerce México',
    us: 'E-commerce Estados Unidos',
    contribution: 'Contribución profesional',
    contributionBody: 'Desarrollo backend, integraciones e-commerce, automatización de inventarios, pedidos y clientes, además de soporte a despliegues.',
    visit: 'Visitar sitio',
    experience: 'Trayectoria',
    experienceTitle: 'Producto, integración y sistemas de negocio.',
    roles: [
      ['2024 — Hoy', 'Full-Stack Developer', 'Nuts Marketing', 'Laravel, e-commerce, Magento/Shopify, APIs y CI/CD.'],
      ['2024 — 2025', 'Web & Mobile Developer', 'Hi-G · colaboración paralela', 'Flutter, Firebase, TypeScript e integraciones Web3.'],
      ['2024', 'Full-Stack Developer', 'IModel / CriptoModel', 'Backend PHP, autenticación y módulos sociales/financieros.'],
      ['2023 — 2024', 'Full-Stack Developer', 'Giro26', 'ERP financiero, arquitectura hexagonal y optimización SQL.'],
    ],
    stack: 'Stack y capacidades',
    stackTitle: 'Profundidad backend. Visión de producto completa.',
    stackBody: 'Explora las capas con las que convierto una necesidad operativa en un producto mantenible y listo para crecer.',
    stackHint: 'Selecciona una capacidad',
    stackFocus: 'Capa activa',
    stackDescriptions: [
      'Servicios sólidos, contratos claros e integraciones diseñadas para operaciones reales.',
      'Interfaces rápidas y accesibles que vuelven comprensibles los flujos complejos.',
      'Modelado, aislamiento y arquitectura para productos confiables y escalables.',
      'Entrega continua, observabilidad y herramientas para operar con seguridad.',
    ],
    stackGroups: [
      ['Backend & APIs', 'Python 3.12 · FastAPI · Uvicorn · Pydantic v2 · Laravel · PHP · .NET · REST · JWT'],
      ['Frontend', 'React 19 · TypeScript · Vite · TanStack Query · TailwindCSS · Radix UI · shadcn/ui · Zod'],
      ['Datos & arquitectura', 'MySQL · SQL Server · PostgreSQL · OpenAI API · SaaS multitenant · ETL & parsing · Arquitectura hexagonal'],
      ['Operación', 'Linux · systemd · Docker · Azure CI/CD · Git/GitHub · SFTP · Magento · Shopify'],
    ],
    finalEyebrow: 'Construyamos algo útil',
    finalTitle: '¿Tienes un proceso complejo que necesita convertirse en producto?',
    finalBody: 'Estoy abierto a colaborar en APIs, plataformas SaaS, automatización, e-commerce y herramientas operativas.',
    email: 'Escríbeme',
    whatsapp: 'WhatsApp',
    whatsappLabel: 'Escríbeme por WhatsApp',
    whatsappMessage: 'Hola Osmar, vi tu portafolio y me gustaría conversar sobre un proyecto.',
    cvLabel: 'Descargar CV',
    cvFull: 'CV Full-Stack',
    cvBack: 'CV Backend',
    cvFront: 'CV Frontend',
    footer: 'Diseñado y construido por Osmar Liera.',
  },
  en: {
    nav: ['Home', 'Products', 'Experience', 'Stack', 'Contact'],
    navIds: ['inicio', 'productos', 'experiencia', 'stack', 'contacto'],
    status: 'Open to remote and hybrid opportunities',
    intro: "Hi, I'm",
    role: 'Backend / Full-Stack Engineer',
    hero: 'I design systems that connect operations, data and product.',
    heroBody: 'I build APIs, multi-tenant SaaS, automation and web experiences with Python, FastAPI, Laravel, React and TypeScript.',
    seeWork: 'View products',
    contact: "Let's talk",
    ownProducts: 'Own products',
    ownTitle: 'Software born from real-world problems.',
    ownBody: 'Three personal products combining architecture, business domain and interface design. Each solves a different operation.',
    viewRepo: 'View repository',
    enlarge: 'Enlarge screenshot',
    professional: 'Professional experience',
    professionalTitle: 'E-commerce across two markets.',
    professionalBody: 'Work delivered as part of the Nuts Marketing team. Shasa retains brand and product ownership.',
    mx: 'Mexico e-commerce',
    us: 'United States e-commerce',
    contribution: 'Professional contribution',
    contributionBody: 'Backend development, e-commerce integrations, inventory, order and customer automation, plus deployment support.',
    visit: 'Visit site',
    experience: 'Career',
    experienceTitle: 'Product, integration and business systems.',
    roles: [
      ['2024 — Present', 'Full-Stack Developer', 'Nuts Marketing', 'Laravel, e-commerce, Magento/Shopify, APIs and CI/CD.'],
      ['2024 — 2025', 'Web & Mobile Developer', 'Hi-G · parallel collaboration', 'Flutter, Firebase, TypeScript and Web3 integrations.'],
      ['2024', 'Full-Stack Developer', 'IModel / CriptoModel', 'PHP backend, authentication and social/financial modules.'],
      ['2023 — 2024', 'Full-Stack Developer', 'Giro26', 'Financial ERP, hexagonal architecture and SQL optimization.'],
    ],
    stack: 'Stack and capabilities',
    stackTitle: 'Backend depth. Complete product perspective.',
    stackBody: 'Explore the layers I use to turn an operational need into a maintainable product built to grow.',
    stackHint: 'Select a capability',
    stackFocus: 'Active layer',
    stackDescriptions: [
      'Solid services, clear contracts and integrations designed for real-world operations.',
      'Fast, accessible interfaces that make complex workflows easy to understand.',
      'Data modeling, tenant isolation and architecture for reliable, scalable products.',
      'Continuous delivery, observability and tooling for safer operations.',
    ],
    stackGroups: [
      ['Backend & APIs', 'Python 3.12 · FastAPI · Uvicorn · Pydantic v2 · Laravel · PHP · .NET · REST · JWT'],
      ['Frontend', 'React 19 · TypeScript · Vite · TanStack Query · TailwindCSS · Radix UI · shadcn/ui · Zod'],
      ['Data & architecture', 'MySQL · SQL Server · PostgreSQL · OpenAI API · Multi-tenant SaaS · ETL & parsing · Hexagonal architecture'],
      ['Operations', 'Linux · systemd · Docker · Azure CI/CD · Git/GitHub · SFTP · Magento · Shopify'],
    ],
    finalEyebrow: "Let's build something useful",
    finalTitle: 'Do you have a complex process that should become a product?',
    finalBody: 'I am open to collaborating on APIs, SaaS platforms, automation, e-commerce and operational tools.',
    email: 'Email me',
    whatsapp: 'WhatsApp',
    whatsappLabel: 'Message me on WhatsApp',
    whatsappMessage: 'Hi Osmar, I saw your portfolio and would like to discuss a project.',
    cvLabel: 'Download résumé',
    cvFull: 'Full-Stack résumé',
    cvBack: 'Backend résumé',
    cvFront: 'Frontend résumé',
    footer: 'Designed and built by Osmar Liera.',
  },
}

function useReveal(dependency: unknown) {
  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [dependency])
}

function ProjectShowcase({
  project,
  locale,
  onOpen,
}: {
  project: Project
  locale: Locale
  onOpen: (src: string, alt: string) => void
}) {
  const [imageIndex, setImageIndex] = useState(0)
  const image = project.images[imageIndex]
  const t = copy[locale]

  return (
    <article className={`project project--${project.tone}`} data-reveal>
      <div className="project__content">
        <div className="project__meta">
          <span>{project.number}</span>
          <span>{project.eyebrow[locale]}</span>
        </div>
        <h3>{project.name}</h3>
        <p className="project__summary">{project.summary[locale]}</p>
        <ul className="project__details">
          {project.details.map((detail) => (
            <li key={detail.es}>
              <Check size={15} aria-hidden="true" />
              {detail[locale]}
            </li>
          ))}
        </ul>
        <div className="project__stack" aria-label="Technology stack">
          {project.stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <a className="text-link" href={project.repo} target="_blank" rel="noreferrer">
          {t.viewRepo} <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="project__visual">
        <button
          className="project__image-button"
          type="button"
          onClick={() => onOpen(image.src, image.alt[locale])}
          aria-label={t.enlarge}
        >
          <img src={image.src} alt={image.alt[locale]} loading="lazy" decoding="async" />
          <span className="image-hint"><ExternalLink size={14} /> {t.enlarge}</span>
        </button>
        {project.images.length > 1 ? (
          <div className="image-tabs" aria-label="Project screenshots">
            {project.images.map((item, index) => (
              <button
                key={item.src}
                type="button"
                className={index === imageIndex ? 'is-active' : ''}
                onClick={() => setImageIndex(index)}
              >
                {item.label[locale]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

const stackIcons = [Server, Code2, Database, Cloud]

function StackExplorer({ locale }: { locale: Locale }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const explorerRef = useRef<HTMLDivElement>(null)
  const t = copy[locale]
  const [activeTitle, activeItems] = t.stackGroups[activeIndex]
  const technologies = activeItems.split(' · ')
  const ActiveIcon = stackIcons[activeIndex]

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const explorer = explorerRef.current
    if (!explorer) return
    const bounds = explorer.getBoundingClientRect()
    explorer.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`)
    explorer.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`)
  }

  return (
    <div className="stack-explorer" ref={explorerRef} onPointerMove={handlePointerMove} data-reveal>
      <div className="stack-explorer__glow" aria-hidden="true" />
      <div className="stack-explorer__topbar">
        <span className="stack-explorer__status"><i /> Capability engine</span>
        <span>{String(activeIndex + 1).padStart(2, '0')} / 04</span>
      </div>

      <div className="stack-explorer__body">
        <div className="stack-selector" role="tablist" aria-label={t.stackHint}>
          <p>{t.stackHint}</p>
          {t.stackGroups.map(([title], index) => {
            const Icon = stackIcons[index]
            const isActive = activeIndex === index
            return (
              <button
                key={title}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'is-active' : ''}
                onClick={() => setActiveIndex(index)}
                onPointerEnter={() => setActiveIndex(index)}
              >
                <span className="stack-selector__number">0{index + 1}</span>
                <Icon size={18} aria-hidden="true" />
                <strong>{title}</strong>
                <ArrowRight size={17} className="stack-selector__arrow" aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <div className="stack-stage" role="tabpanel" key={`${locale}-${activeIndex}`}>
          <div className="stack-orbit" aria-hidden="true">
            <span className="stack-orbit__ring stack-orbit__ring--one" />
            <span className="stack-orbit__ring stack-orbit__ring--two" />
            <span className="stack-orbit__pulse" />
            <div className="stack-orbit__core"><ActiveIcon size={34} /></div>
            <span className="stack-orbit__node stack-orbit__node--one">{technologies[0]}</span>
            <span className="stack-orbit__node stack-orbit__node--two">{technologies[1]}</span>
            <span className="stack-orbit__node stack-orbit__node--three">{technologies[2]}</span>
          </div>

          <div className="stack-stage__copy">
            <span>{t.stackFocus}</span>
            <h3>{activeTitle}</h3>
            <p>{t.stackDescriptions[activeIndex]}</p>
            <div className="tech-cloud" aria-label={`${activeTitle} technologies`}>
              {technologies.map((technology, index) => (
                <span key={technology} style={{ '--tech-delay': `${index * 45}ms` } as React.CSSProperties}>
                  {technology}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [locale, setLocale] = useState<Locale>('es')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cvOpen, setCvOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const t = copy[locale]
  const whatsappHref = `https://wa.me/5216151559659?text=${encodeURIComponent(t.whatsappMessage)}`

  useReveal(locale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
    }
    document.body.classList.add('no-scroll')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightbox])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" onClick={closeMenu} aria-label="Osmar Liera — Home">
          <span className="brand__mark">OL</span>
          <span className="brand__name">Osmar Liera</span>
        </a>

        <nav className={menuOpen ? 'nav is-open' : 'nav'} aria-label="Primary navigation">
          {t.nav.map((item, index) => (
            <a key={item} href={`#${t.navIds[index]}`} onClick={closeMenu}>
              {item}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="language-button"
            type="button"
            onClick={() => setLocale((current) => (current === 'es' ? 'en' : 'es'))}
            aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
          >
            <Languages size={16} aria-hidden="true" />
            {locale === 'es' ? 'EN' : 'ES'}
          </button>
          <a className="header-contact" href="#contacto">{t.contact}</a>
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero__grid" aria-hidden="true" />
          <div className="hero__orb hero__orb--one" aria-hidden="true" />
          <div className="hero__orb hero__orb--two" aria-hidden="true" />
          <div className="hero__content">
            <div className="status-pill">
              <span /> {t.status}
            </div>
            <p className="hero__intro">{t.intro} <strong>Osmar Liera.</strong></p>
            <h1>{t.hero}</h1>
            <p className="hero__body">{t.heroBody}</p>
            <div className="hero__actions">
              <a className="button button--primary" href="#productos">
                {t.seeWork} <ArrowDown size={17} aria-hidden="true" />
              </a>
              <a className="button button--ghost button--whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle size={17} aria-hidden="true" /> {t.whatsapp}
              </a>
            </div>
          </div>

          <aside className="hero__console" aria-label="Professional profile">
            <div className="console__top">
              <span /><span /><span />
              <small>profile.ts</small>
            </div>
            <div className="console__body">
              <p><span className="code-muted">01</span><span className="code-key">const</span> engineer = &#123;</p>
              <p><span className="code-muted">02</span>&nbsp;&nbsp;role: <span className="code-value">'{t.role}'</span>,</p>
              <p><span className="code-muted">03</span>&nbsp;&nbsp;focus: [</p>
              <p><span className="code-muted">04</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-value">'APIs'</span>, <span className="code-value">'SaaS'</span>,</p>
              <p><span className="code-muted">05</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-value">'Automation'</span>,</p>
              <p><span className="code-muted">06</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="code-value">'E-commerce'</span></p>
              <p><span className="code-muted">07</span>&nbsp;&nbsp;],</p>
              <p><span className="code-muted">08</span>&nbsp;&nbsp;location: <span className="code-value">'La Paz, MX'</span></p>
              <p><span className="code-muted">09</span>&#125;</p>
            </div>
            <div className="console__footer">
              <span><Server size={14} /> Backend-first</span>
              <span><Layers3 size={14} /> Product-minded</span>
            </div>
          </aside>

          <div className="hero__rail" aria-label="Core technologies">
            {['PYTHON', 'FASTAPI', 'LARAVEL', 'REACT', 'TYPESCRIPT', 'MYSQL', 'DOCKER'].map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </section>

        <section className="section section--projects" id="productos">
          <div className="section-heading" data-reveal>
            <p className="eyebrow"><Sparkles size={15} /> {t.ownProducts}</p>
            <h2>{t.ownTitle}</h2>
            <p>{t.ownBody}</p>
          </div>
          <div className="projects-list">
            {projects.map((project) => (
              <ProjectShowcase key={project.name} project={project} locale={locale} onOpen={(src, alt) => setLightbox({ src, alt })} />
            ))}
          </div>
        </section>

        <section className="section section--professional" id="experiencia">
          <div className="section-heading section-heading--light" data-reveal>
            <p className="eyebrow"><BriefcaseBusiness size={15} /> {t.professional}</p>
            <h2>{t.professionalTitle}</h2>
            <p>{t.professionalBody}</p>
          </div>

          <div className="commerce-grid" data-reveal>
            <a className="commerce-card" href="https://shasa.com/" target="_blank" rel="noreferrer">
              <div className="commerce-card__market">MX</div>
              <div>
                <span>{t.contribution}</span>
                <h3>Shasa México</h3>
                <p>{t.mx}</p>
              </div>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="commerce-card" href="https://us.shasa.com/" target="_blank" rel="noreferrer">
              <div className="commerce-card__market">US</div>
              <div>
                <span>{t.contribution}</span>
                <h3>Shasa USA</h3>
                <p>{t.us}</p>
              </div>
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className="contribution-note" data-reveal>{t.contributionBody}</p>

          <div className="timeline" data-reveal>
            <div className="timeline__heading">
              <span>{t.experience}</span>
              <h3>{t.experienceTitle}</h3>
            </div>
            <div className="timeline__list">
              {t.roles.map(([date, role, company, description]) => (
                <article className="timeline__item" key={`${company}-${date}`}>
                  <time>{date}</time>
                  <div>
                    <h4>{role}</h4>
                    <strong>{company}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--stack" id="stack">
          <div className="section-heading" data-reveal>
            <p className="eyebrow"><Code2 size={15} /> {t.stack}</p>
            <h2>{t.stackTitle}</h2>
            <p>{t.stackBody}</p>
          </div>
          <StackExplorer locale={locale} />
        </section>

        <section className="contact-section" id="contacto">
          <div className="contact-section__inner" data-reveal>
            <p className="eyebrow"><Globe2 size={15} /> {t.finalEyebrow}</p>
            <h2>{t.finalTitle}</h2>
            <p>{t.finalBody}</p>
            <div className="contact-actions">
              <a className="button button--primary button--whatsapp-primary" href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> {t.whatsapp}
              </a>
              <a className="button button--ghost" href="mailto:lieragomezosmaralejandro@gmail.com">
                <Mail size={17} /> {t.email}
              </a>
              <div className="cv-menu">
                <button className="button button--ghost" type="button" onClick={() => setCvOpen((open) => !open)} aria-expanded={cvOpen}>
                  <Download size={17} /> {t.cvLabel} <ChevronDown size={16} />
                </button>
                {cvOpen ? (
                  <div className="cv-menu__popover">
                    <a href="/cv/osmar-liera-fullstack.pdf" download><FileText size={16} /> {t.cvFull}</a>
                    <a href="/cv/osmar-liera-backend.pdf" download><FileText size={16} /> {t.cvBack}</a>
                    <a href="/cv/osmar-liera-frontend.pdf" download><FileText size={16} /> {t.cvFront}</a>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="social-links">
              <a href="https://github.com/OsmarLG" target="_blank" rel="noreferrer"><GitBranch size={18} /> GitHub</a>
              <a href="https://linkedin.com/in/osmar-lg" target="_blank" rel="noreferrer"><ContactRound size={18} /> LinkedIn</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span className="brand__mark">OL</span>
        <p>{t.footer}</p>
        <p>© {new Date().getFullYear()}</p>
      </footer>

      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer" aria-label={t.whatsappLabel}>
        <span className="whatsapp-float__pulse" aria-hidden="true" />
        <MessageCircle size={21} aria-hidden="true" />
        <span>{t.whatsapp}</span>
      </a>

      {lightbox ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={lightbox.alt} onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} aria-label="Close image"><X /></button>
          <img src={lightbox.src} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  )
}

export default App
