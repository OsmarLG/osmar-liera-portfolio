/**
 * Blog category filter.
 * - A pill slides behind the active chip (and morphs across pages with view transitions).
 * - On the index, which lists every post, choosing a category filters in place: cards
 *   rearrange with a view transition (or a short fade), the heading, intro and title switch
 *   to the category's, and the URL becomes the category page's, so reloading or sharing
 *   lands on the real page. Back/forward work.
 * - On category pages the chips stay normal links. Without JS everything is a link.
 */
export function initBlogFilter(): void {
  const nav = document.querySelector<HTMLElement>('[data-blog-filters]');
  const pill = nav?.querySelector<HTMLElement>('[data-filter-pill]');
  if (!nav || !pill) {
    return;
  }
  const chips = [...nav.querySelectorAll<HTMLAnchorElement>('[data-filter]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = chips.find((chip) => chip.getAttribute('aria-current') === 'page') ?? chips[0];

  const placePill = (chip: HTMLElement): void => {
    const box = nav.getBoundingClientRect();
    const rect = chip.getBoundingClientRect();
    pill.style.width = `${rect.width}px`;
    pill.style.height = `${rect.height}px`;
    pill.style.transform = `translate(${rect.left - box.left}px, ${rect.top - box.top}px)`;
  };
  placePill(current);
  // Measured before the transition is enabled, so the pill does not fly in on load.
  requestAnimationFrame(() => {
    nav.dataset.pillReady = '';
  });
  window.addEventListener('resize', () => placePill(current), { passive: true });

  const grid = document.querySelector<HTMLElement>('[data-blog-grid]');
  if (!grid || grid.dataset.inPlace === undefined) {
    return;
  }
  const items = [...grid.querySelectorAll<HTMLElement>('[data-category]')];
  const heading = document.querySelector<HTMLElement>('[data-blog-heading]');
  const intro = document.querySelector<HTMLElement>('[data-blog-intro]');
  const kicker = document.querySelector<HTMLElement>('[data-blog-kicker] .kicker > span:last-child');
  const status = document.querySelector<HTMLElement>('[data-blog-status]');

  const apply = (chip: HTMLAnchorElement, push: boolean): void => {
    const filter = chip.dataset.filter ?? 'all';
    const update = (): void => {
      let shown = 0;
      items.forEach((item) => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.hidden = !match;
        if (match) {
          shown += 1;
          // Anything the scroll reveal had not shown yet appears now.
          item.style.opacity = '';
          item.style.transform = '';
        }
      });
      chips.forEach((other) => {
        if (other === chip) {
          other.setAttribute('aria-current', 'page');
        } else {
          other.removeAttribute('aria-current');
        }
      });
      if (heading && chip.dataset.heading) {
        heading.textContent = chip.dataset.heading;
      }
      if (intro && chip.dataset.intro) {
        intro.textContent = chip.dataset.intro;
      }
      if (kicker && chip.dataset.kicker) {
        kicker.textContent = chip.dataset.kicker;
      }
      if (chip.dataset.title) {
        document.title = chip.dataset.title;
      }
      if (status) {
        status.textContent = `${shown} ${shown === 1 ? 'artículo' : 'artículos'}`;
      }
      current = chip;
      placePill(chip);
    };

    if (!reduceMotion && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      update();
      if (!reduceMotion) {
        items
          .filter((item) => !item.hidden)
          .forEach((item, index) => {
            item.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
              duration: 420,
              delay: index * 45,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'backwards',
            });
          });
      }
    }
    if (push) {
      history.pushState({ blogFilter: filter }, '', chip.href);
    }
  };

  nav.addEventListener('click', (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-filter]');
    if (!chip || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (chip !== current) {
      apply(chip, true);
    }
  });

  window.addEventListener('popstate', () => {
    const chip = chips.find((item) => new URL(item.href).pathname === window.location.pathname) ?? chips[0];
    if (chip !== current) {
      apply(chip, false);
    }
  });
}
