import { apiRequest } from './api';
import { WeeklyInsight } from '@/types';

export async function fetchWeeklyInsights(): Promise<WeeklyInsight> {
  return apiRequest<WeeklyInsight>('/insights/weekly');
}
