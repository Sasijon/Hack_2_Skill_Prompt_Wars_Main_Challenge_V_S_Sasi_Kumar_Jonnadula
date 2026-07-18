import { apiRequest } from './api';
import { supabase } from './supabase';
import Constants from 'expo-constants';
import { ChatMessage } from '@/types';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8000';
export interface SendMessageResponse {
  reply: string;
  habit_id: string | null;
  message_id: string;
}

export async function sendChatMessage(
  message: string,
  habitId?: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>('/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, habit_id: habitId ?? null }),
  });
}

export async function sendChatMessageStream(
  message: string,
  onChunk: (text: string) => void,
  habitId?: string
): Promise<SendMessageResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/chat/`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (session?.access_token) {
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    }

    let processedIndex = 0;
    let finalMessageId = `temp-${Date.now()}`;
    let buffer = '';

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        if (xhr.status >= 400) {
           if (xhr.readyState === 4) reject(new Error(`API Error: ${xhr.status}`));
           return;
        }
        const responseText = xhr.responseText || '';
        const newData = responseText.substring(processedIndex);
        processedIndex = responseText.length;
        
        buffer += newData;
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const eventString = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (eventString.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(eventString.substring(6));
              if (parsed.chunk) onChunk(parsed.chunk);
              if (parsed.message_id) finalMessageId = parsed.message_id;
            } catch (e) {
              // Ignore incomplete or invalid JSON chunks
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      if (xhr.readyState === 4) {
        if (xhr.status < 400) {
          resolve({ reply: '', habit_id: habitId ?? null, message_id: finalMessageId });
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.send(JSON.stringify({ message, habit_id: habitId ?? null }));
  });
}


export async function fetchChatHistory(habitId?: string): Promise<ChatMessage[]> {
  const params = habitId ? `?habit_id=${habitId}` : '';
  return apiRequest<ChatMessage[]>(`/chat/history${params}`);
}

export async function clearChatHistory(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/chat/', { method: 'DELETE' });
}
