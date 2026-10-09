/**
 * Progressive enhancement for every page: menu disclosure, header state,
 * scroll-spy, WAI-ARIA tabs and the screenshot dialog. Everything works
 * without this script; it only adds behaviour.
 */

type ScrollHandler = (target: HTMLElement) => void;

let scrollToTarget: ScrollHandler = (target) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

/** Lets the motion layer (Lenis) take over in-page scrolling. */
export function setScrollHandler(handler: ScrollHandler): void {
  scrollToTarget = handler;
}

function initMenu(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const button = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const label = button?.querySelector<HTMLElement>('[data-menu-label]');
  if (!header || !button || !nav || !label) {
    return;
  }

  header.dataset.menuReady = '';
  button.hidden = false;

  const setOpen = (open: boolean, returnFocus = false): void => {
    button.setAttribute('aria-expanded', String(open));
    label.textContent = open ? (button.dataset.labelClose ?? '') : (button.dataset.labelOpen ?? '');
    if (open) {
      header.dataset.open = '';
    } else {
      delete header.dataset.open;
      if (returnFocus) {
        button.focus();
      }
    }
  };

  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  });

  nav.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) {
      setOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target as Node)) {
      setOpen(false);
    }
  });

  window.matchMedia('(min-width: 921px)').addEventListener('change', (query) => {
    if (query.matches) {
      setOpen(false);
    }
  });
}

function initHeaderState(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) {
    return;
  }
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      delete header.dataset.scrolled;
    } else {
      header.dataset.scrolled = '';
    }
  }).observe(sentinel);
}

/** In-page anchors: smooth scroll (when allowed) and move focus to the target. */
function initAnchors(): void {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link) {
      return;
    }
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) {
      return;
    }
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) {
      return;
    }
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    scrollToTarget(target);
    target.focus({ preventScroll: true });
    history.pushState(null, '', url.hash);
  });
}

function initScrollSpy(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  const sections = links
    .map((link) => document.getElementById(link.dataset.navLink ?? ''))
    .filter((section): section is HTMLElement => section !== null);
  if (sections.length === 0) {
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        links.forEach((link) => {
          if (link.dataset.navLink === entry.target.id) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
}

/** Highlights the current step of the decorative request → result rail. */
function initTraceSteps(): void {
  const steps = [...document.querySelectorAll<HTMLElement>('[data-trace-step]')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-step]')];
  if (steps.length === 0 || sections.length === 0) {
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const current = (entry.target as HTMLElement).dataset.step;
        let reached = true;
        steps.forEach((step) => {
          step.dataset.state = step.dataset.traceStep === current ? 'active' : reached ? 'done' : 'idle';
          if (step.dataset.traceStep === current) {
            reached = false;
          }
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
}

/** WAI-ARIA tabs with automatic activation (arrows, Home, End). */
function initTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
    const tablist = root.querySelector<HTMLElement>('[role="tablist"]');
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));
    if (!tablist || tabs.length === 0 || panels.some((panel) => panel === null)) {
      return;
    }

    const select = (index: number, focus = false): void => {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        const panel = panels[i] as HTMLElement;
        panel.hidden = !selected;
      });
      if (focus) {
        tabs[index].focus();
      }
      root.dataset.active = String(index);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', (event) => {
        const last = tabs.length - 1;
        const keys: Record<string, number> = {
          ArrowRight: index === last ? 0 : index + 1,
          ArrowDown: index === last ? 0 : index + 1,
          ArrowLeft: index === 0 ? last : index - 1,
          ArrowUp: index === 0 ? last : index - 1,
          Home: 0,
          End: last,
        };
        if (event.key in keys) {
          event.preventDefault();
          select(keys[event.key], true);
        }
      });
    });

    tablist.hidden = false;
    root.dataset.tabsReady = '';
    root.querySelectorAll<HTMLElement>('[data-tab-fallback-heading]').forEach((heading) => {
      heading.hidden = true;
    });
    select(0);
  });
}

/** Screenshot dialog built on <dialog>: focus is trapped, Esc closes, focus returns. */
function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!dialog || typeof dialog.showModal !== 'function') {
    return;
  }
  const frame = dialog.querySelector<HTMLElement>('[data-lightbox-frame]');
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]');
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  if (!frame || !caption || !closeButton) {
    return;
  }
  let opener: HTMLElement | null = null;

  document.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-lightbox-trigger]');
    if (!trigger || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    opener = trigger;
    const image = new Image(Number(trigger.dataset.width ?? 0) || 1600, Number(trigger.dataset.height ?? 0) || 900);
    image.decoding = 'async';
    image.alt = trigger.dataset.alt ?? '';
    image.src = trigger.href;
    frame.replaceChildren(image);
    caption.textContent = trigger.dataset.alt ?? '';
    dialog.showModal();
    document.documentElement.dataset.dialogOpen = '';
    closeButton.focus();
  });

  /** Idempotent cleanup: the `close` event can arrive late, so it also runs right after closing. */
  const finish = (): void => {
    if (!document.documentElement.hasAttribute('data-dialog-open')) {
      return;
    }
    delete document.documentElement.dataset.dialogOpen;
    frame.replaceChildren();
    opener?.focus();
    opener = null;
  };

  const closeDialog = (): void => {
    dialog.close();
    finish();
  };

  closeButton.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });

  dialog.addEventListener('close', finish);
}

export function initSite(): void {
  initMenu();
  initHeaderState();
  initAnchors();
  initScrollSpy();
  initTraceSteps();
  initTabs();
  initLightbox();
}
