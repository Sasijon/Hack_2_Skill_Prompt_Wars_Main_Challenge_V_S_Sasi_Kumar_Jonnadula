// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export type HabitCategory =
  | 'screen_time'
  | 'substance'
  | 'eating'
  | 'custom';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  daily_goal?: number;       // max allowed per day (minutes or count)
  goal_unit?: string;        // 'minutes' | 'times' | 'grams' etc.
  target_start_date?: string; // ISO date
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHabitPayload {
  name: string;
  description?: string;
  category: HabitCategory;
  daily_goal?: number;
  goal_unit?: string;
  target_start_date?: string;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;         // ISO date
  value: number;            // duration or count
  intensity: number;        // 1-5 scale
  notes?: string;
  slipped: boolean;         // true = relapse, false = resisted
  created_at: string;
}

export interface CreateLogPayload {
  habit_id: string;
  log_date: string;
  value: number;
  intensity: number;
  notes?: string;
  slipped: boolean;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  habit_id?: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

// ─── Nudges ──────────────────────────────────────────────────────────────────

export type NudgeFrequency = 'off' | 'gentle' | 'regular';

export interface Nudge {
  id: string;
  user_id: string;
  habit_id?: string;
  message: string;
  sent_at: string;
  opened: boolean;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start: string;       // ISO date (Monday)
  summary: string;          // AI-generated narrative
  recommendations: string[]; // 3 actionable tips
  generated_at: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface HealthCheckResponse {
  status: string;
  supabase: string;
  version: string;
}
