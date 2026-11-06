/**
 * Motion layer. Only loaded when the visitor has NOT asked for reduced motion.
 * GSAP + ScrollTrigger drive scroll-linked reveals and diagrams; Lenis adds
 * smooth scrolling. Every animation is finite.
 *
 * Pages marked with body[data-flair] (home, blog list) also get the expressive layer:
 * decoding headings, section wipes, the pinned "cómo trabajo" block, magnetic primary
 * buttons and a cursor halo. The CV stays sober.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { setScrollHandler } from './site';

function initSmoothScroll(): void {
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const header = document.querySelector<HTMLElement>('[data-header]');
  setScrollHandler((target) => {
    lenis.scrollTo(target, { offset: -((header?.offsetHeight ?? 0) + 16) });
  });

  new MutationObserver(() => {
    if (document.documentElement.hasAttribute('data-dialog-open')) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-dialog-open'] });
}

/**
 * Reveals use opacity only (never visibility), so content that has not been
 * animated yet stays focusable. Focusing it completes its reveal at once.
 */
function revealOnFocus(): void {
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement;
    const host = target.closest<HTMLElement>('[data-reveal], [data-reveal-group] > *, [data-flow-node]');
    if (host) {
      gsap.killTweensOf(host);
      gsap.set(host, { opacity: 1, y: 0 });
    }
  });
}

/** Only content below the first screen is hidden, so nothing visible ever flashes. */
const belowFold = (element: HTMLElement): boolean => element.getBoundingClientRect().top > window.innerHeight;

/** Hides what is below the fold and reveals it in batches as it scrolls in. */
function revealBatch(elements: HTMLElement[], from: gsap.TweenVars, to: gsap.TweenVars, start: string): void {
  if (elements.length === 0) {
    return;
  }
  gsap.set(elements, from);
  ScrollTrigger.batch(elements, { start, once: true, onEnter: (batch) => gsap.to(batch, { ...to, overwrite: true }) });
}

function initReveals(): void {
  // One batched set of triggers instead of one ScrollTrigger per element.
  const blocks = [
    ...gsap.utils.toArray<HTMLElement>('[data-reveal], [data-split-title]'),
    ...gsap.utils.toArray<HTMLElement>('[data-reveal-group] > *'),
  ].filter(belowFold);
  revealBatch(blocks, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 'top 88%');

  const lines = gsap.utils.toArray<HTMLElement>('.kicker__line').filter(belowFold);
  revealBatch(lines, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.out' }, 'top 90%');
}

function initTraceRail(): void {
  const progress = document.querySelector<HTMLElement>('[data-trace-progress]');
  if (!progress) {
    return;
  }
  gsap.set(progress, { scaleY: 0, transformOrigin: 'top center' });
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => gsap.set(progress, { scaleY: self.progress }),
  });
}

function initCounters(): void {
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((element) => {
    const target = Number(element.dataset.count ?? '0');
    const prefix = element.dataset.prefix ?? '';
    const suffix = element.dataset.suffix ?? '';
    const state = { value: 0 };
    element.textContent = `${prefix}0${suffix}`;
    gsap.to(state, {
      value: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 90%', once: true },
      onUpdate: () => {
        element.textContent = `${prefix}${Math.round(state.value)}${suffix}`;
      },
    });
  });
}

/** Architecture diagrams: columns light up in order and a packet travels each link. */
interface FlowLoop {
  flow: HTMLElement;
  loop: gsap.core.Timeline;
  trigger: ScrollTrigger;
  entered: boolean;
  userPaused: boolean;
}

const flowLoops: FlowLoop[] = [];

/** Plays a diagram's loop only while it is on screen, the tab is visible and the user has not paused it. */
function syncLoop(item: FlowLoop): void {
  const shouldRun = item.entered && !item.userPaused && item.trigger.isActive && document.visibilityState === 'visible';
  if (shouldRun) {
    item.loop.play();
  } else {
    item.loop.pause();
  }
}

/**
 * Architecture diagrams.
 * - Entrance (single play): columns light up in order and the links draw.
 * - Loop (continuous): packets travel every link and each column's nodes light up as a packet
 *   reaches them. It plays while the diagram is in the viewport, pauses when it leaves, and
 *   resumes on re-entry in either scroll direction. A button lets visitors pause it (WCAG 2.2.2).
 */
function initDiagrams(): void {
  gsap.utils.toArray<HTMLElement>('[data-flow]').forEach((flow) => {
    const columns = [...flow.querySelectorAll<HTMLElement>('[data-flow-column]')];
    const packets = [...flow.querySelectorAll<HTMLElement>('[data-flow-packet]')];
    const toggle = flow.querySelector<HTMLButtonElement>('[data-flow-toggle]');

    const entrance = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    columns.forEach((column, index) => {
      const nodes = column.querySelectorAll<HTMLElement>('[data-flow-node]');
      entrance.fromTo(nodes, { opacity: 0.15, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, immediateRender: false }, index === 0 ? 0 : '>-0.1');
      const link = column.querySelector<HTMLElement>('[data-flow-link]');
      if (link) {
        entrance.fromTo(link, { '--draw': 0 }, { '--draw': 1, duration: 0.45, ease: 'power1.inOut', immediateRender: false }, '>-0.15');
      }
    });

    const step = 0.9;
    gsap.set(packets, { visibility: 'visible', opacity: 0 });
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.3 });
    columns.forEach((column, index) => {
      const nodes = column.querySelectorAll<HTMLElement>('[data-flow-node]');
      loop.call(() => nodes.forEach((node) => node.classList.add('is-hot')), [], index * step);
      loop.call(() => nodes.forEach((node) => node.classList.remove('is-hot')), [], index * step + step * 0.9);
      const packet = column.querySelector<HTMLElement>('[data-flow-packet]');
      if (packet) {
        loop.to(
          packet,
          { keyframes: { '--travel': [0, 1], opacity: [0, 1, 1, 0] }, duration: step * 0.85, ease: 'power1.inOut' },
          index * step + step * 0.15,
        );
      }
    });
    if (packets.length === 0) {
      loop.to({}, { duration: step });
    }

    const item: FlowLoop = {
      flow,
      loop,
      entered: false,
      userPaused: false,
      trigger: ScrollTrigger.create({
        trigger: flow,
        start: 'top 85%',
        end: 'bottom 15%',
        onToggle: () => syncLoop(item),
        onEnter: () => {
          if (!item.entered) {
            entrance.play().then(() => {
              item.entered = true;
              syncLoop(item);
            });
          }
        },
        onEnterBack: () => {
          if (!item.entered) {
            entrance.progress(1);
            item.entered = true;
          }
          syncLoop(item);
        },
      }),
    };

    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        item.userPaused = !item.userPaused;
        const label = item.userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause;
        toggle.querySelector('[data-flow-toggle-label]')!.textContent = label ?? '';
        if (item.userPaused) {
          toggle.dataset.paused = '';
        } else {
          delete toggle.dataset.paused;
        }
        if (item.userPaused) {
          flow.querySelectorAll('.is-hot').forEach((node) => node.classList.remove('is-hot'));
          gsap.set(packets, { opacity: 0 });
        }
        syncLoop(item);
      });
    }

    flowLoops.push(item);
  });

  const resync = (): void => flowLoops.forEach(syncLoop);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      ScrollTrigger.update();
    }
    resync();
  });
  // Restored from the back/forward cache (e.g. back from the CV page): re-measure and resume.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      ScrollTrigger.refresh();
      resync();
    }
  });
}

function initApprovalCard(): void {
  const card = document.querySelector<HTMLElement>('[data-approval]');
  if (!card) {
    return;
  }
  const status = card.querySelector<HTMLElement>('[data-approval-status]');
  const approve = card.querySelector<HTMLElement>('[data-approval-approve]');
  ScrollTrigger.create({
    trigger: card,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      const timeline = gsap.timeline({ delay: 0.9 });
      timeline
        .to(approve, { scale: 0.94, duration: 0.12, ease: 'power2.in' })
        .to(approve, { scale: 1, duration: 0.3, ease: 'back.out(3)' })
        .add(() => {
          card.dataset.state = 'approved';
          if (status) {
            status.textContent = status.dataset.approved ?? status.textContent;
          }
        });
    },
  });
}

/* ---------------------------------------------------------------------------
 * Expressive layer (body[data-flair])
 * ------------------------------------------------------------------------- */

const GLYPHS = '<>/_-=+*#{}[]01$%';
const randomGlyph = (): string => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/**
 * Terminal-style decode for a heading. The real text stays in place (transparent, so it
 * keeps the layout and is what assistive tech reads); an aria-hidden copy on top resolves
 * left to right behind a short band of random glyphs. No layout shift, nothing to unhide.
 */
function decode(heading: HTMLElement): void {
  const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!text || heading.children.length > 0 || heading.dataset.decoded !== undefined) {
    return;
  }
  heading.dataset.decoded = '';
  const layer = document.createElement('span');
  layer.className = 'decode-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.color = getComputedStyle(heading).color;
  const done = document.createElement('span');
  const noise = document.createElement('span');
  noise.className = 'decode-layer__noise';
  const rest = document.createElement('span');
  rest.className = 'decode-layer__rest';
  layer.append(done, noise, rest);
  heading.classList.add('is-decoding');
  heading.append(layer);

  const band = 7;
  const state = { progress: 0 };
  gsap.to(state, {
    progress: 1,
    duration: Math.min(1.3, 0.45 + text.length * 0.018),
    ease: 'power2.out',
    onUpdate: () => {
      const resolved = Math.floor(state.progress * text.length);
      const bandEnd = Math.min(text.length, resolved + band);
      done.textContent = text.slice(0, resolved);
      noise.textContent = [...text.slice(resolved, bandEnd)].map((char) => (char === ' ' ? ' ' : randomGlyph())).join('');
      rest.textContent = text.slice(bandEnd);
    },
    onComplete: () => {
      layer.remove();
      heading.classList.remove('is-decoding');
    },
  });
}

function initDecodeHeadings(): void {
  gsap.utils
    .toArray<HTMLElement>('[data-split-title]')
    .filter(belowFold)
    .forEach((heading) => {
      ScrollTrigger.create({ trigger: heading, start: 'top 86%', once: true, onEnter: () => decode(heading) });
    });
}

/**
 * Section wipes: a translucent panel sweeps in from the left behind each section while a
 * trace line runs along its top edge. Purely decorative (pseudo-elements + a CSS variable).
 */
function initSectionWipes(): void {
  document.documentElement.classList.add('has-wipes');
  gsap.utils
    .toArray<HTMLElement>('main .section')
    .filter(belowFold)
    .forEach((section) => {
      gsap.fromTo(
        section,
        { '--wipe': 0 },
        { '--wipe': 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 98%', end: 'top 30%', scrub: 0.6 } },
      );
    });
}

/**
 * "Cómo trabajo": on wide screens the block pins and the three steps play like a deck while
 * the rail fills (diagnóstico → implementación → seguimiento). Elsewhere the steps stack
 * and simply reveal.
 */
function initProcess(): void {
  const section = document.querySelector<HTMLElement>('[data-process]');
  const pinTarget = section?.querySelector<HTMLElement>('[data-process-pin]');
  if (!section || !pinTarget) {
    return;
  }
  const steps = gsap.utils.toArray<HTMLElement>('[data-process-step]', section);
  const dots = gsap.utils.toArray<HTMLElement>('[data-process-dot]', section);
  const fill = section.querySelector<HTMLElement>('[data-process-fill]');
  const lines = gsap.utils.toArray<HTMLElement>('[data-log-line]', section);
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1000px) and (min-height: 660px)', () => {
    section.dataset.pinned = '';
    const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    gsap.set(steps.slice(1), { opacity: 0, yPercent: 16, rotateX: -14 });
    steps.forEach((step, index) => {
      const stepLines = step.querySelectorAll<HTMLElement>('[data-log-line]');
      const label = `step${index}`;
      timeline.addLabel(label, index === 0 ? 0 : undefined);
      if (index > 0) {
        timeline.to(steps[index - 1], { opacity: 0, yPercent: -12, rotateX: 12, scale: 0.94, duration: 1 }, label);
        timeline.to(step, { opacity: 1, yPercent: 0, rotateX: 0, duration: 1 }, label);
      }
      timeline.fromTo(
        stepLines,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.18, ease: 'power2.out' },
        index > 0 ? `${label}+=0.65` : 0,
      );
      timeline.to({}, { duration: 0.9 });
    });
    if (fill) {
      timeline.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: timeline.duration() }, 0);
    }
    const setActive = (progress: number): void => {
      const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      dots.forEach((dot, index) => {
        dot.dataset.state = index < active ? 'done' : index === active ? 'active' : 'idle';
      });
    };
    ScrollTrigger.create({
      trigger: pinTarget,
      start: 'center center',
      end: () => `+=${Math.round(window.innerHeight * steps.length * 0.8)}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      animation: timeline,
      invalidateOnRefresh: true,
      onUpdate: (self) => setActive(self.progress),
    });
    return () => {
      delete section.dataset.pinned;
      gsap.set([...steps, ...lines], { clearProps: 'opacity,transform' });
    };
  });

  mm.add('(max-width: 999px), (max-height: 659px)', () => {
    revealBatch(steps.filter(belowFold), { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 'top 88%');
  });
}

/** Primary buttons lean towards the pointer (a few px) and spring back. Fine pointers only. */
function initMagneticButtons(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }
  gsap.utils.toArray<HTMLElement>('.btn--primary').forEach((button) => {
    button.classList.add('is-magnetic');
    const xTo = gsap.quickTo(button, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(button, 'y', { duration: 0.45, ease: 'power3.out' });
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      xTo(((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 7);
      yTo(((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 5);
    });
    button.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/** A soft light that follows the mouse behind the content and tightens over controls. */
function initCursorHalo(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  document.body.append(halo);
  const xTo = gsap.quickTo(halo, 'x', { duration: 0.6, ease: 'power3.out' });
  const yTo = gsap.quickTo(halo, 'y', { duration: 0.6, ease: 'power3.out' });
  let visible = false;
  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') {
        return;
      }
      if (!visible) {
        gsap.set(halo, { x: event.clientX, y: event.clientY });
        halo.classList.add('is-on');
        visible = true;
      }
      xTo(event.clientX);
      yTo(event.clientY);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    halo.classList.remove('is-on');
    visible = false;
  });
  document.addEventListener('pointerover', (event) => {
    const interactive = (event.target as Element | null)?.closest('a, button, label, summary, [role="tab"]');
    halo.classList.toggle('is-hot', Boolean(interactive));
  });
}

function initParallax(): void {
  const portrait = document.querySelector<HTMLElement>('[data-parallax]');
  if (!portrait) {
    return;
  }
  gsap.to(portrait, {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: { trigger: portrait, start: 'top top', end: 'bottom top', scrub: true },
  });
}

export function initMotion(): void {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('has-motion');
  initSmoothScroll();
  initReveals();
  revealOnFocus();
  initTraceRail();
  initCounters();
  initDiagrams();
  initApprovalCard();
  initParallax();
  if (document.body.hasAttribute('data-flair')) {
    initDecodeHeadings();
    initSectionWipes();
    initProcess();
    initMagneticButtons();
    initCursorHalo();
  }
  ScrollTrigger.refresh();
}
