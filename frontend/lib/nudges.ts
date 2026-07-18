import { apiRequest } from './api';

export interface Nudge {
  id: string;
  user_id: string;
  habit_id: string;
  message: string;
  sent_at: string;
  opened: boolean;
}

export async function fetchNudges(limit = 20): Promise<Nudge[]> {
  return apiRequest<Nudge[]>(`/nudges/?limit=${limit}`);
}

export async function markNudgeOpened(nudgeId: string): Promise<void> {
  return apiRequest<void>(`/nudges/${nudgeId}/open`, {
    method: 'POST',
  });
}
