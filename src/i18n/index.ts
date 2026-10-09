import en from './en';
import es from './es';
import type { Dictionary, Lang } from './types';

const dictionaries: Record<Lang, Dictionary> = { es, en };

export const getDictionary = (lang: Lang): Dictionary => dictionaries[lang];

export type { Dictionary, Lang } from './types';
