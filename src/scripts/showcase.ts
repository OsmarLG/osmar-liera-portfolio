/**
 * Showcase videos (VideoReel, ReelRow). No dependencies.
 *
 * - A video downloads nothing until it plays (preload="none") and plays only while it is on screen.
 * - In a row, only the reel nearest the centre plays; arrows, arrow keys and a tap pick another.
 * - With prefers-reduced-motion or Save-Data nothing autoplays: the poster stays and the
 *   play button starts the video.
 * - Every video has a play / pause button; a reel the visitor paused stays paused.
 */

interface Reel {
  root: HTMLElement;
  video: HTMLVideoElement;
  /** The visitor paused it: do not autoplay it again. */
  held: boolean;
  /** It is on screen (and, in a row, it is the chosen one). */
  wanted: boolean;
}

const still = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

function sync(reel: Reel): void {
  if (reel.wanted && !reel.held && !still()) {
    // A rejected play() (autoplay policy, data saver) leaves the poster and the play button.
    void reel.video.play().catch(() => undefined);
  } else if (!reel.wanted || reel.held) {
    reel.video.pause();
  }
}

function setUpReel(root: HTMLElement): Reel | null {
  const video = root.querySelector<HTMLVideoElement>('[data-reel-video]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-reel-toggle]');
  if (!video || !toggle) {
    return null;
  }
  const reel: Reel = { root, video, held: false, wanted: false };

  video.controls = false;
  video.muted = true;
  toggle.hidden = false;
  root.dataset.ready = '';
  root.dataset.state = 'paused';

  const reflect = (): void => {
    const playing = !video.paused;
    root.dataset.state = playing ? 'playing' : 'paused';
    toggle.setAttribute('aria-label', (playing ? toggle.dataset.labelPause : toggle.dataset.labelPlay) ?? '');
  };
  video.addEventListener('play', reflect);
  video.addEventListener('pause', reflect);

  root.addEventListener('click', () => {
    if (video.paused) {
      reel.held = false;
      void video.play().catch(() => undefined);
    } else {
      reel.held = true;
      video.pause();
    }
  });

  return reel;
}

/** A reel on its own: plays while most of it is on screen. */
function initSingles(reels: Reel[]): void {
  const byRoot = new Map(reels.map((reel) => [reel.root, reel] as const));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const reel = byRoot.get(entry.target as HTMLElement);
        if (reel) {
          reel.wanted = entry.isIntersecting;
          sync(reel);
        }
      });
    },
    { threshold: 0.6 },
  );
  reels.forEach((reel) => observer.observe(reel.root));
}

function initRow(row: HTMLElement, reelOf: (root: HTMLElement) => Reel | undefined): void {
  const track = row.querySelector<HTMLElement>('[data-reelrow-track]');
  const items = [...row.querySelectorAll<HTMLElement>('[data-reelrow-item]')];
  if (!track || items.length === 0) {
    return;
  }
  const reels = items.map((item) => {
    const root = item.querySelector<HTMLElement>('[data-reel]');
    return root ? reelOf(root) : undefined;
  });
  const prev = row.querySelector<HTMLButtonElement>('[data-reelrow-prev]');
  const next = row.querySelector<HTMLButtonElement>('[data-reelrow-next]');

  let visible = false;
  let active = 0;
  /** Chosen with the arrows or a tap; holds until the visitor scrolls the row by hand. */
  let forced: number | null = null;

  const nearestToCentre = (): number => {
    const centre = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    items.forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - centre);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  };

  const apply = (): void => {
    active = forced ?? nearestToCentre();
    items.forEach((item, index) => {
      item.toggleAttribute('data-active', index === active);
      const reel = reels[index];
      if (reel) {
        reel.wanted = visible && index === active;
        sync(reel);
      }
    });
    if (prev && next) {
      prev.disabled = active === 0;
      next.disabled = active === items.length - 1;
    }
  };

  const go = (index: number): void => {
    forced = Math.max(0, Math.min(items.length - 1, index));
    const item = items[forced]!;
    const reel = reels[forced];
    if (reel) {
      reel.held = false;
    }
    track.scrollTo({
      left: item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2,
      behavior: still() ? 'auto' : 'smooth',
    });
    apply();
  };

  let frame = 0;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  const release = (): void => {
    forced = null;
  };
  track.addEventListener('wheel', release, { passive: true });
  track.addEventListener('touchmove', release, { passive: true });

  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  prev?.addEventListener('click', () => go(active - 1));
  next?.addEventListener('click', () => go(active + 1));
  row.querySelector<HTMLElement>('[data-reelrow-nav]')?.removeAttribute('hidden');

  // Playing a reel by hand makes it the active one, so the others stop.
  reels.forEach((reel, index) => {
    reel?.root.addEventListener('click', () => {
      if (index !== active && !reel.held) {
        forced = index;
        apply();
      }
    });
  });

  new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      apply();
    },
    { threshold: 0.35 },
  ).observe(track);

  row.dataset.ready = '';
  apply();
}

let started = false;

export function initShowcase(): void {
  if (started || typeof IntersectionObserver === 'undefined') {
    return;
  }
  started = true;

  const reels = new Map<HTMLElement, Reel>();
  document.querySelectorAll<HTMLElement>('[data-reel]').forEach((root) => {
    const reel = setUpReel(root);
    if (reel) {
      reels.set(root, reel);
    }
  });

  const inRow = new Set<HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-reelrow]').forEach((row) => {
    row.querySelectorAll<HTMLElement>('[data-reel]').forEach((root) => inRow.add(root));
    initRow(row, (root) => reels.get(root));
  });

  initSingles([...reels.values()].filter((reel) => !inRow.has(reel.root)));
}
