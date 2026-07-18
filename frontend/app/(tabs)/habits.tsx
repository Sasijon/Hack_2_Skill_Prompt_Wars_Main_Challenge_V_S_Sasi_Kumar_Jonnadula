import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Habit } from '@/types';
import { fetchHabits } from '@/lib/habits';
import { CATEGORY_META } from '@/lib/habitMeta';
import { StreakBadge } from '@/components/StreakBadge';

function HabitCard({ habit, onPress }: { habit: Habit; onPress: () => void }) {
  const meta = CATEGORY_META[habit.category];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${habit.name}. ${meta.label}. ${habit.current_streak > 0 ? `${habit.current_streak} day streak` : 'No streak yet'}. Tap to view details`}
      accessibilityRole="button"
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji} accessible={false}>{meta.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{habit.name}</Text>
          <Text style={styles.cardCategory}>{meta.label}</Text>
          {habit.daily_goal ? (
            <Text style={styles.cardGoal}>
              Goal: max {habit.daily_goal} {habit.goal_unit ?? 'per day'}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        <StreakBadge streak={habit.current_streak} size="sm" />
        <Text style={styles.chevron} accessible={false}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyState} accessibilityLiveRegion="polite">
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={styles.emptyTitle}>No habits yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first habit to start tracking your progress.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={onAdd}
        accessibilityLabel="Add your first habit"
        accessibilityRole="button"
      >
        <Text style={styles.emptyBtnText}>Add a Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchHabits();
      setHabits(data);
    } catch (err: any) {
      setError('Could not load habits. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever screen comes into focus (e.g. after add/edit/delete)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" accessibilityLabel="Loading habits" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
          <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={habits.length === 0 ? styles.listEmptyContainer : styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle} accessibilityRole="header">
              My Habits
            </Text>
            <Text style={styles.screenSubtitle}>
              {habits.length} active habit{habits.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState onAdd={() => router.push('/habit/add')} />
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onPress={() => router.push(`/habit/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#4F46E5"
            accessibilityLabel="Pull to refresh habits"
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* FAB — add habit */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/habit/add')}
        accessibilityLabel="Add a new habit"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  listEmptyContainer: { flex: 1, padding: 16 },
  listHeader: { marginBottom: 16 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  screenSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardCategory: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  cardGoal: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  chevron: { fontSize: 22, color: '#D1D5DB', fontWeight: '300' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '300' },
});
