/**
 * Habit detail screen.
 * Route: /habit/<id>
 * Shows streak, goal, recent logs, and edit/delete actions.
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Habit } from '@/types';
import { fetchHabit, deleteHabit } from '@/lib/habits';
import { CATEGORY_META } from '@/lib/habitMeta';
import { StreakBadge } from '@/components/StreakBadge';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const h = await fetchHabit(id);
      setHabit(h);
    } catch {
      Alert.alert('Error', 'Could not load habit.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload when navigating back from edit screen
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function handleDelete() {
    Alert.alert(
      'Delete habit?',
      `"${habit?.name}" will be removed. Your logs will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteHabit(id!);
              router.back();
            } catch {
              Alert.alert('Error', 'Could not delete habit. Please try again.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading || !habit) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" accessibilityLabel="Loading habit" />
      </View>
    );
  }

  const meta = CATEGORY_META[habit.category];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        accessibilityLabel="Back to habits list"
        accessibilityRole="button"
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* Title area */}
      <View style={styles.titleRow}>
        <Text style={styles.emoji} accessible={false}>{meta.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} accessibilityRole="header">{habit.name}</Text>
          <Text style={styles.category}>{meta.label}</Text>
        </View>
      </View>

      {habit.description ? (
        <Text style={styles.description}>{habit.description}</Text>
      ) : null}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard} accessibilityLabel={`Current streak: ${habit.current_streak} days`}>
          <StreakBadge streak={habit.current_streak} size="md" />
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statCard} accessibilityLabel={`Best streak: ${habit.longest_streak} days`}>
          <Text style={styles.statValue}>🏆 {habit.longest_streak}d</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        {habit.daily_goal ? (
          <View style={styles.statCard} accessibilityLabel={`Daily goal: ${habit.daily_goal} ${habit.goal_unit ?? ''}`}>
            <Text style={styles.statValue}>🎯 {habit.daily_goal}</Text>
            <Text style={styles.statLabel}>{habit.goal_unit ?? 'per day'}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/habit/add?id=${habit.id}`)}
          accessibilityLabel="Edit this habit"
          accessibilityRole="button"
        >
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={deleting}
          accessibilityLabel="Delete this habit"
          accessibilityRole="button"
          accessibilityState={{ disabled: deleting, busy: deleting }}
        >
          {deleting ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.deleteBtnText}>🗑 Delete</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Log button */}
      <TouchableOpacity
        style={styles.logBtn}
        onPress={() => router.push(`/(tabs)/log?habitId=${habit.id}`)}
        accessibilityLabel={`Log today's activity for ${habit.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.logBtnText}>📝 Log Today</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Habit tracking started{' '}
        {new Date(habit.created_at).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 48 },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#4F46E5', fontSize: 15, fontWeight: '500' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  emoji: { fontSize: 36, marginTop: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', flexWrap: 'wrap' },
  category: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  description: { fontSize: 14, color: '#4B5563', marginBottom: 20, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  editBtn: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  editBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  logBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  logBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
