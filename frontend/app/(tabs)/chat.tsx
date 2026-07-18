/**
 * AI Coach Chat Screen — Task 5
 * Real-time chat with Gemini 1.5 Flash, context-aware of user's habits and logs.
 */
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { ChatMessage } from '@/types';
import { sendChatMessageStream, fetchChatHistory, clearChatHistory } from '@/lib/chat';
import { useAuth } from '@/context/AuthContext';

// ─── Bubble ──────────────────────────────────────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const time = new Date(message.created_at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}
      accessible
      accessibilityLabel={`${isUser ? 'You' : 'AI Coach'}: ${message.content}`}
    >
      {!isUser && (
        <View style={styles.avatarCircle} accessible={false}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAssistant]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={styles.avatarCircle} accessible={false}>
        <Text style={styles.avatarText}>🤖</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
        <Text style={styles.typingDots} accessibilityLabel="AI Coach is typing">
          ● ● ●
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const history = await fetchChatHistory();
      setMessages(history);
    } catch {
      // First visit — empty history is fine
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || typing) return;

    setInput('');
    setError(null);
    Keyboard.dismiss();

    // Optimistically add user message
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: user?.id ?? '',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTyping(true);

    try {
      let firstChunkReceived = false;
      const aiMsgTempId = `ai-temp-${Date.now()}`;

      const response = await sendChatMessageStream(text, (chunk) => {
        if (!firstChunkReceived) {
          firstChunkReceived = true;
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgTempId,
              user_id: user?.id ?? '',
              role: 'assistant',
              content: chunk,
              created_at: new Date().toISOString(),
            }
          ]);
        } else {
          setMessages((prev) => prev.map((m) => {
            if (m.id === aiMsgTempId) {
              return { ...m, content: m.content + chunk };
            }
            return m;
          }));
        }
      });

      // Update with final message id
      setMessages((prev) => prev.map((m) => {
        if (m.id === aiMsgTempId) {
          return { ...m, id: response.message_id || aiMsgTempId };
        }
        if (m.id === optimisticMsg.id) {
          return { ...m, id: `user-${Date.now()}` };
        }
        return m;
      }));
    } catch (err: any) {
      // Remove optimistic message and show error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setError('Could not reach AI Coach. Check your connection and try again.');
    } finally {
      setTyping(false);
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    []
  );

  async function handleClear() {
    try {
      setLoading(true);
      await clearChatHistory();
      setMessages([]);
    } catch (err) {
      setError('Failed to clear chat history.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              AI Coach
            </Text>
            <View style={styles.onlineDot} accessibilityLabel="AI Coach is online" />
          </View>
          <Text style={styles.headerSubtitle}>Powered by Gemini 1.5 Flash</Text>
        </View>
        <TouchableOpacity 
          style={styles.clearBtn} 
          onPress={handleClear}
          accessibilityLabel="Start a new chat"
          accessibilityRole="button"
        >
          <Text style={styles.clearBtnText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
          <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} accessibilityLabel="Dismiss error">
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" accessibilityLabel="Loading chat history" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState} accessibilityLiveRegion="polite">
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Your AI Coach is here</Text>
              <Text style={styles.emptySubtitle}>
                Share how you&apos;re feeling, ask for strategies, or just talk about your progress.
                Your habit data is automatically shared with the coach.
              </Text>
            </View>
          }
          ListFooterComponent={typing ? <TypingIndicator /> : null}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Message your AI coach…"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          accessibilityLabel="Type a message to your AI coach"
          editable={!typing}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || typing}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !input.trim() || typing }}
        >
          {typing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerInfo: {},
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  errorDismiss: { color: '#9CA3AF', fontSize: 16, paddingLeft: 8 },
  messageList: { padding: 16, paddingBottom: 8 },
  messageListEmpty: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAssistant: { color: '#111827' },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeAssistant: { color: '#9CA3AF' },
  typingBubble: { paddingVertical: 14 },
  typingDots: { color: '#9CA3AF', fontSize: 12, letterSpacing: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7D2FE' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
});
