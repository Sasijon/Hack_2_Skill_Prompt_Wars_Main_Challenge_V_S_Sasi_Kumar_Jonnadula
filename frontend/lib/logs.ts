import { apiRequest } from './api';
import { HabitLog, CreateLogPayload } from '@/types';

export async function createLog(payload: CreateLogPayload): Promise<HabitLog> {
  return apiRequest<HabitLog>('/logs/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchLogs(
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitLog[]> {
  const params = new URLSearchParams({ habit_id: habitId });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  return apiRequest<HabitLog[]>(`/logs/?${params.toString()}`);
}
