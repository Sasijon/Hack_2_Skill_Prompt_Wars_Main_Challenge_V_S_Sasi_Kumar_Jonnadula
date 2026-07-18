import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchNudges, markNudgeOpened, Nudge } from '@/lib/nudges';

export default function NudgesScreen() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadNudges = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchNudges();
      setNudges(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNudges();
    }, [])
  );

  const handleOpenNudge = async (nudge: Nudge) => {
    if (nudge.opened) return;
    try {
      await markNudgeOpened(nudge.id);
      setNudges((prev) => prev.map((n) => (n.id === nudge.id ? { ...n, opened: true } : n)));
    } catch (e) {
      console.warn('Failed to mark nudge opened', e);
    }
  };

  const renderItem = ({ item }: { item: Nudge }) => (
    <TouchableOpacity
      style={[styles.nudgeCard, !item.opened && styles.unreadNudge]}
      onPress={() => handleOpenNudge(item)}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔔</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.message, !item.opened && styles.unreadMessage]}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.sent_at).toLocaleString()}</Text>
      </View>
      {!item.opened && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadNudges} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={nudges}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNudges} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📬</Text>
                <Text style={styles.emptyText}>You're all caught up!</Text>
                <Text style={styles.emptySubtext}>Your AI Coach will nudge you here if you forget to log your habits.</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: 16, flexGrow: 1 },
  nudgeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNudge: {
    backgroundColor: '#EEF2FF', // light indigo
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: { color: '#EF4444', marginBottom: 12, textAlign: 'center' },
  retryBtn: { padding: 8, backgroundColor: '#E5E7EB', borderRadius: 8 },
  retryText: { color: '#374151', fontWeight: '500' },
});
