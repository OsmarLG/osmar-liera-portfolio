/**
 * Article page enhancements, without GSAP (articles stay light):
 * - reading progress bar for the article body,
 * - scroll-spy for the table of contents,
 * - cover parallax on scroll and a gentle tilt towards the pointer.
 * Without JS the bar stays empty, the TOC is a plain list of links and the cover is static.
 */
export function initArticle(): void {
  const body = document.querySelector<HTMLElement>('[data-article-body]');
  const bar = document.querySelector<HTMLElement>('[data-read-progress]');
  const cover = document.querySelector<HTMLElement>('[data-cover]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Progress + parallax share one scroll handler, batched per frame.
  let queued = false;
  const update = (): void => {
    queued = false;
    const viewport = window.innerHeight;
    if (body && bar) {
      const rect = body.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (viewport * 0.6 - rect.top) / Math.max(1, rect.height - viewport * 0.4)));
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    }
    if (cover && !reduceMotion) {
      const rect = cover.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < viewport) {
        const offset = (rect.top + rect.height / 2 - viewport / 2) / viewport;
        cover.style.setProperty('--shift', `${(offset * -28).toFixed(2)}px`);
      }
    }
  };
  const onScroll = (): void => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  if (cover && !reduceMotion) {
    cover.dataset.parallax = '';
    if (finePointer) {
      cover.addEventListener('pointermove', (event) => {
        const rect = cover.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        cover.style.setProperty('--rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
        cover.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`);
        cover.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        cover.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        cover.dataset.tilting = '';
      });
      cover.addEventListener('pointerleave', () => {
        cover.style.setProperty('--rx', '0deg');
        cover.style.setProperty('--ry', '0deg');
        delete cover.dataset.tilting;
      });
    }
  }

  initTocSpy();
}

/** Marks the TOC link of the section being read (aria-current="location"). */
function initTocSpy(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
  const headings = links
    .map((link) => document.getElementById(link.dataset.tocLink ?? ''))
    .filter((heading): heading is HTMLElement => heading !== null);
  if (headings.length === 0) {
    return;
  }
  const setActive = (id: string): void => {
    links.forEach((link) => {
      if (link.dataset.tocLink === id) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };
  const visible = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });
      // The first heading inside the reading band wins; otherwise the last one above it.
      const inBand = headings.find((heading) => visible.has(heading.id));
      if (inBand) {
        setActive(inBand.id);
        return;
      }
      const above = headings.filter((heading) => heading.getBoundingClientRect().top < window.innerHeight * 0.2);
      if (above.length > 0) {
        setActive(above[above.length - 1].id);
      } else {
        links.forEach((link) => link.removeAttribute('aria-current'));
      }
    },
    { rootMargin: '-12% 0px -68% 0px' },
  );
  headings.forEach((heading) => observer.observe(heading));
}
