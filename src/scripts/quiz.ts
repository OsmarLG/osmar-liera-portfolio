/**
 * "Diagnóstico en 30 segundos": one question at a time, a recommendation from the real
 * service list and a WhatsApp link with the answers. The link is a normal `a[data-wa]`,
 * so the site-wide tracked builder (labs.elroi.cloud/wa + attribution) and the
 * whatsapp_click event handle it on click. Nothing is sent anywhere before that click.
 */
import { track } from './analytics';
import { whatsappHref } from '../i18n/profile';
import type { QuizServiceKey } from '../i18n/types';

interface QuizData {
  order: QuizServiceKey[];
  results: Record<QuizServiceKey, { name: string; why: string }>;
  progress: string;
  next: string;
  seeResult: string;
  firstStep: string;
  firstStepDiagnostic: string;
  messageIntro: string;
  messageOutro: string;
  summaryLabels: string[];
}

export interface QuizAnswer {
  label: string;
  short: string;
  scores: Partial<Record<QuizServiceKey, number>>;
}

/** Highest total wins; ties go to the service listed first in `order` (the diagnosis). */
export function recommend(answers: QuizAnswer[], order: QuizServiceKey[]): QuizServiceKey {
  const totals = new Map<QuizServiceKey, number>(order.map((key) => [key, 0]));
  answers.forEach((answer) => {
    Object.entries(answer.scores).forEach(([key, points]) => {
      const service = key as QuizServiceKey;
      totals.set(service, (totals.get(service) ?? 0) + (points ?? 0));
    });
  });
  return order.reduce((best, key) => ((totals.get(key) ?? 0) > (totals.get(best) ?? 0) ? key : best), order[0]);
}

export function buildMessage(data: QuizData, answers: QuizAnswer[], service: string): string {
  const lines = answers.map((answer, index) => `• ${data.summaryLabels[index]}: ${answer.short}`);
  return [data.messageIntro, ...lines, data.messageOutro.replace('{service}', service)].join('\n');
}

export function initQuiz(): void {
  const root = document.querySelector<HTMLElement>('[data-quiz]');
  const raw = root?.querySelector('[data-quiz-data]')?.textContent;
  const form = root?.querySelector<HTMLFormElement>('[data-quiz-form]');
  const result = root?.querySelector<HTMLElement>('[data-quiz-result]');
  if (!root || !raw || !form || !result) {
    return;
  }
  const data = JSON.parse(raw) as QuizData;
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-quiz-step]')];
  const back = form.querySelector<HTMLButtonElement>('[data-quiz-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-quiz-next]')!;
  const nextLabel = next.querySelector<HTMLElement>('[data-quiz-next-label]')!;
  const error = form.querySelector<HTMLElement>('[data-quiz-error]')!;
  const count = root.querySelector<HTMLElement>('[data-quiz-count]');
  const progress = root.querySelector<HTMLElement>('[data-quiz-progress]');
  const status = root.querySelector<HTMLElement>('[data-quiz-status]');
  const waLink = result.querySelector<HTMLAnchorElement>('[data-quiz-wa]')!;
  const total = steps.length;
  const pad = (value: number): string => String(value).padStart(2, '0');
  let current = 0;
  let pointerAnswer = false;
  let advanceTimer = 0;

  root.querySelector<HTMLElement>('[data-quiz-fallback]')!.hidden = true;
  root.querySelector<HTMLElement>('[data-quiz-meta]')!.hidden = false;
  if (count) {
    count.hidden = false;
  }
  form.hidden = false;

  const checked = (index: number): HTMLInputElement | null => steps[index].querySelector<HTMLInputElement>('input:checked');

  const setProgress = (value: number): void => {
    if (progress) {
      progress.style.transform = `scaleX(${value})`;
    }
  };

  const show = (index: number, direction: 'forward' | 'back' | null, focus = true): void => {
    current = index;
    steps.forEach((step, i) => {
      step.hidden = i !== index;
      if (i === index && direction) {
        step.dataset.enter = direction;
      } else {
        delete step.dataset.enter;
      }
    });
    back.hidden = index === 0;
    nextLabel.textContent = index === total - 1 ? data.seeResult : data.next;
    error.hidden = true;
    if (count) {
      count.textContent = `${pad(index + 1)} / ${pad(total)}`;
    }
    setProgress((index + 1) / (total + 1));
    if (status) {
      status.textContent = data.progress.replace('{n}', String(index + 1)).replace('{total}', String(total));
    }
    if (focus) {
      (checked(index) ?? steps[index].querySelector<HTMLInputElement>('input'))?.focus();
    }
  };

  const answers = (): QuizAnswer[] =>
    steps.map((_, index) => {
      const input = checked(index)!;
      return {
        label: input.closest('label')?.textContent?.trim() ?? input.value,
        short: input.dataset.short ?? input.value,
        scores: JSON.parse(input.dataset.scores ?? '{}') as QuizAnswer['scores'],
      };
    });

  const showResult = (): void => {
    const picked = answers();
    const key = recommend(picked, data.order);
    const service = data.results[key];
    result.querySelector('[data-quiz-name]')!.textContent = service.name;
    result.querySelector('[data-quiz-why]')!.textContent = service.why;
    result.querySelector('[data-quiz-first]')!.textContent = key === 'diagnostico' ? data.firstStepDiagnostic : data.firstStep;

    const summary = result.querySelector<HTMLElement>('[data-quiz-summary]')!;
    summary.replaceChildren(
      ...picked.map((answer, index) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const value = document.createElement('dd');
        term.textContent = data.summaryLabels[index];
        value.textContent = answer.short;
        row.append(term, value);
        return row;
      }),
    );

    const message = buildMessage(data, picked, service.name);
    waLink.dataset.waMessage = message;
    waLink.href = whatsappHref(message);

    form.hidden = true;
    result.hidden = false;
    result.dataset.enter = '';
    if (count) {
      count.textContent = '✓';
    }
    setProgress(1);
    if (status) {
      status.textContent = '';
    }
    result.focus();
    track('quiz_complete', { recommendation: key });
  };

  const advance = (): void => {
    window.clearTimeout(advanceTimer);
    if (!checked(current)) {
      error.hidden = false;
      steps[current].querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    if (current < total - 1) {
      show(current + 1, 'forward');
    } else {
      showResult();
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    advance();
  });

  // Picking an option with the pointer moves on by itself; with the keyboard, arrows only
  // change the choice and Enter (or the button) moves on, so nothing jumps away mid-choice.
  form.addEventListener('pointerdown', () => {
    pointerAnswer = true;
  });
  form.addEventListener('keydown', () => {
    pointerAnswer = false;
  });
  form.addEventListener('change', () => {
    error.hidden = true;
    if (pointerAnswer) {
      window.clearTimeout(advanceTimer);
      advanceTimer = window.setTimeout(advance, 320);
    }
  });

  back.addEventListener('click', () => {
    window.clearTimeout(advanceTimer);
    if (current > 0) {
      show(current - 1, 'back');
    }
  });

  result.querySelector<HTMLButtonElement>('[data-quiz-restart]')!.addEventListener('click', () => {
    form.reset();
    result.hidden = true;
    delete result.dataset.enter;
    form.hidden = false;
    show(0, 'back');
  });

  show(0, null, false);
}
