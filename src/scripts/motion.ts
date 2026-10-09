/**
 * Motion layer. Only loaded when the visitor has NOT asked for reduced motion.
 * GSAP + ScrollTrigger drive scroll-linked reveals and diagrams; Lenis adds
 * smooth scrolling. Every animation is finite.
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

function initReveals(): void {
  // One batched set of triggers instead of one ScrollTrigger per element.
  const blocks = [
    ...gsap.utils.toArray<HTMLElement>('[data-reveal], [data-split-title]'),
    ...gsap.utils.toArray<HTMLElement>('[data-reveal-group] > *'),
  ].filter(belowFold);
  gsap.set(blocks, { opacity: 0, y: 32 });
  ScrollTrigger.batch(blocks, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, overwrite: true }),
  });

  const lines = gsap.utils.toArray<HTMLElement>('.kicker__line').filter(belowFold);
  gsap.set(lines, { scaleX: 0 });
  ScrollTrigger.batch(lines, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { scaleX: 1, duration: 0.9, ease: 'power2.out', overwrite: true }),
  });
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
function initDiagrams(): void {
  gsap.utils.toArray<HTMLElement>('[data-flow]').forEach((flow) => {
    const columns = flow.querySelectorAll<HTMLElement>('[data-flow-column]');
    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
    });

    columns.forEach((column, index) => {
      const nodes = column.querySelectorAll<HTMLElement>('[data-flow-node]');
      timeline.from(nodes, { opacity: 0.15, y: 14, duration: 0.45, stagger: 0.07 }, index === 0 ? 0 : '>-0.1');
      const link = column.querySelector<HTMLElement>('[data-flow-link]');
      if (link) {
        timeline.fromTo(link, { '--draw': 0 }, { '--draw': 1, duration: 0.45, ease: 'power1.inOut' }, '>-0.15');
      }
    });

    const packets = flow.querySelectorAll<HTMLElement>('[data-flow-packet]');
    if (packets.length > 0) {
      timeline.fromTo(
        packets,
        { '--travel': 0, autoAlpha: 1 },
        { '--travel': 1, duration: 1.1, ease: 'power1.inOut', stagger: 0.35, repeat: 2, repeatDelay: 0.4 },
        '>',
      );
      timeline.to(packets, { autoAlpha: 0, duration: 0.3 });
    }

    ScrollTrigger.create({
      trigger: flow,
      start: 'top 75%',
      once: true,
      onEnter: () => timeline.play(),
    });
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
  ScrollTrigger.refresh();
}
