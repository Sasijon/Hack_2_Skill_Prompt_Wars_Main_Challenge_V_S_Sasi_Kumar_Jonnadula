import { HabitCategory } from '@/types';

export interface CategoryMeta {
  label: string;
  emoji: string;
  defaultUnit: string;
  defaultGoalLabel: string;
}

export const CATEGORY_META: Record<HabitCategory, CategoryMeta> = {
  screen_time: {
    label: 'Screen Time',
    emoji: '📱',
    defaultUnit: 'minutes',
    defaultGoalLabel: 'Max minutes per day',
  },
  substance: {
    label: 'Substance',
    emoji: '🚬',
    defaultUnit: 'times',
    defaultGoalLabel: 'Max times per day',
  },
  eating: {
    label: 'Eating',
    emoji: '🍔',
    defaultUnit: 'times',
    defaultGoalLabel: 'Max times per day',
  },
  custom: {
    label: 'Custom',
    emoji: '✏️',
    defaultUnit: 'times',
    defaultGoalLabel: 'Max per day',
  },
};

export const CATEGORIES: HabitCategory[] = [
  'screen_time',
  'substance',
  'eating',
  'custom',
];

export function streakLabel(streak: number): string {
  if (streak === 0) return 'No streak yet';
  if (streak === 1) return '1 day streak 🔥';
  return `${streak} day streak 🔥`;
}
