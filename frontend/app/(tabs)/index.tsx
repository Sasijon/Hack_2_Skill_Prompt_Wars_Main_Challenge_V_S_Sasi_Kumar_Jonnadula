import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchHabits } from '@/lib/habits';
import { fetchLogs } from '@/lib/logs';
import { Habit } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const firstName = user?.email?.split('@')[0] ?? '';

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loggedTodayCount, setLoggedTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadDashboard = async () => {
        try {
          setLoading(true);
          const userHabits = await fetchHabits();
          setHabits(userHabits);
          
          const todayStr = new Date().toISOString().split('T')[0];
          let loggedCount = 0;
          
          // fetch logs for today for each habit
          for (const habit of userHabits) {
            const logs = await fetchLogs(habit.id, todayStr, todayStr);
            if (logs.length > 0) {
              loggedCount++;
            }
          }
          setLoggedTodayCount(loggedCount);
        } catch (e) {
          console.warn('Failed to load dashboard', e);
        } finally {
          setLoading(false);
        }
      };
      
      loadDashboard();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting} accessibilityRole="header">
        {getGreeting()}{firstName ? `, ${firstName}` : ''} 👋
      </Text>
      <Text style={styles.tagline}>How are you feeling today?</Text>

      {/* Today's summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Progress</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
        ) : habits.length === 0 ? (
          <Text style={styles.cardSubtitle}>
            No habits tracked yet. Add your first habit to get started.
          </Text>
        ) : (
          <View>
            <Text style={styles.progressText}>
              You have logged <Text style={styles.boldText}>{loggedTodayCount}</Text> out of <Text style={styles.boldText}>{habits.length}</Text> habits today.
            </Text>
            {loggedTodayCount === habits.length ? (
              <Text style={styles.motivationalText}>Great job! You're all caught up. 🎉</Text>
            ) : (
              <Text style={styles.motivationalText}>Keep going! Log your remaining habits to keep your streaks alive.</Text>
            )}
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/habits')}
          accessibilityLabel="Go to my habits"
          accessibilityRole="button"
        >
          <Text style={styles.actionEmoji}>🎯</Text>
          <Text style={styles.actionLabel}>My Habits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/chat')}
          accessibilityLabel="Chat with AI coach"
          accessibilityRole="button"
        >
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={styles.actionLabel}>AI Coach</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/insights')}
          accessibilityLabel="View weekly insights"
          accessibilityRole="button"
        >
          <Text style={styles.actionEmoji}>📊</Text>
          <Text style={styles.actionLabel}>Insights</Text>
        </TouchableOpacity>
      </View>

      {/* User info */}
      {user?.email ? (
        <Text style={styles.userEmail} accessibilityLabel={`Signed in as ${user.email}`}>
          Signed in as {user.email}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={signOut}
        accessibilityLabel="Sign out of HabitHeal"
        accessibilityRole="button"
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 48 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 4 },
  tagline: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#6B7280' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionEmoji: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  userEmail: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  signOutBtn: { alignItems: 'center', paddingVertical: 12 },
  signOutText: { color: '#EF4444', fontSize: 14, fontWeight: '500' },
  progressText: { fontSize: 15, color: '#374151', marginBottom: 8 },
  boldText: { fontWeight: '700', color: '#111827' },
  motivationalText: { fontSize: 14, color: '#4F46E5', fontWeight: '500' },
});
