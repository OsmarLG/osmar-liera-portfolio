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
