import { apiRequest } from './api';
import { Habit, CreateHabitPayload } from '@/types';

export async function fetchHabits(): Promise<Habit[]> {
  return apiRequest<Habit[]>('/habits/');
}

export async function fetchHabit(habitId: string): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${habitId}`);
}

export async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
  return apiRequest<Habit>('/habits/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHabit(
  habitId: string,
  payload: Partial<CreateHabitPayload>
): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${habitId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteHabit(habitId: string): Promise<void> {
  return apiRequest<void>(`/habits/${habitId}`, { method: 'DELETE' });
}
