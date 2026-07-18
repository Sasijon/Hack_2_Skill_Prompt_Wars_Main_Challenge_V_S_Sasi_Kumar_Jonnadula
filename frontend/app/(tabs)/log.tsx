/**
 * Daily Log Screen — Task 4
 * User selects a habit, picks date, sets value/intensity, notes, and slip/resist toggle.
 * Streak recalculation happens server-side after every log submission.
 */
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Habit } from '@/types';
import { fetchHabits } from '@/lib/habits';
import { createLog } from '@/lib/logs';
import { CATEGORY_META } from '@/lib/habitMeta';

// ─── Intensity Selector ──────────────────────────────────────────────────────
function IntensitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
  return (
    <View>
      <View style={styles.intensityRow} accessibilityLabel={`Urge intensity: ${labels[value]}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.intensityBtn, value === n && styles.intensityBtnActive]}
            onPress={() => onChange(n)}
            accessibilityRole="radio"
            accessibilityLabel={`Intensity ${n}: ${labels[n]}`}
            accessibilityState={{ selected: value === n }}
          >
            <Text style={[styles.intensityBtnText, value === n && styles.intensityBtnTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.intensityLabel}>{labels[value]}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LogScreen() {
  const router = useRouter();
  const { habitId: preselectedId } = useLocalSearchParams<{ habitId?: string }>();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(preselectedId ?? null);
  const [habitLoading, setHabitLoading] = useState(true);

  const [logDate] = useState(new Date().toISOString().split('T')[0]); // today, YYYY-MM-DD
  const [value, setValue] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [notes, setNotes] = useState('');
  const [slipped, setSlipped] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    setHabitLoading(true);
    try {
      const data = await fetchHabits();
      setHabits(data);
      if (!selectedHabitId && data.length > 0) {
        setSelectedHabitId(data[0].id);
      }
    } catch {
      // Silently fail — user will see empty list
    } finally {
      setHabitLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) ?? null;

  async function handleSubmit() {
    if (!selectedHabitId) {
      setFormError('Please select a habit to log.');
      return;
    }
    if (slipped === null) {
      setFormError('Did you resist or slip? Please select one.');
      return;
    }
    if (value && (isNaN(Number(value)) || Number(value) < 0)) {
      setFormError('Amount must be a positive number.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await createLog({
        habit_id: selectedHabitId,
        log_date: logDate,
        value: value ? Number(value) : 0,
        intensity,
        notes: notes.trim() || undefined,
        slipped,
      });

      Alert.alert(
        slipped ? 'Logged 📝' : 'Great job! 🔥',
        slipped
          ? "Every slip is a chance to learn. Tomorrow is a new day."
          : "You resisted! Your streak just got stronger.",
        [{ text: 'OK', onPress: () => router.push('/(tabs)/habits') }]
      );

      // Reset form
      setValue('');
      setNotes('');
      setSlipped(null);
      setIntensity(3);
    } catch (err: any) {
      setFormError(err?.message ?? 'Could not save log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (habitLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" accessibilityLabel="Loading habits" />
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyTitle}>No habits yet</Text>
        <Text style={styles.emptySubtitle}>Add a habit first before logging.</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/habit/add')}
          accessibilityLabel="Add a habit"
          accessibilityRole="button"
        >
          <Text style={styles.emptyBtnText}>Add a Habit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title} accessibilityRole="header">
          Log Today
        </Text>
        <Text style={styles.subtitle}>
          {new Date(logDate).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Error */}
        {formError ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <Text style={styles.errorText} accessibilityRole="alert">{formError}</Text>
          </View>
        ) : null}

        {/* Habit selector */}
        <Text style={styles.label}>Which habit?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.habitScroll}
          accessibilityLabel="Select habit to log"
        >
          {habits.map((h) => {
            const meta = CATEGORY_META[h.category];
            const selected = h.id === selectedHabitId;
            return (
              <TouchableOpacity
                key={h.id}
                style={[styles.habitChip, selected && styles.habitChipSelected]}
                onPress={() => setSelectedHabitId(h.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${h.name}${selected ? ', selected' : ''}`}
                accessibilityState={{ selected }}
              >
                <Text style={styles.chipEmoji}>{meta.emoji}</Text>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                  {h.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slip / Resist toggle */}
        <Text style={styles.label}>How did it go?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, slipped === false && styles.toggleBtnResist]}
            onPress={() => setSlipped(false)}
            accessibilityRole="radio"
            accessibilityLabel="I resisted"
            accessibilityState={{ selected: slipped === false }}
          >
            <Text style={styles.toggleEmoji}>💪</Text>
            <Text style={[styles.toggleLabel, slipped === false && styles.toggleLabelResist]}>
              I Resisted!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, slipped === true && styles.toggleBtnSlipped]}
            onPress={() => setSlipped(true)}
            accessibilityRole="radio"
            accessibilityLabel="I slipped"
            accessibilityState={{ selected: slipped === true }}
          >
            <Text style={styles.toggleEmoji}>😔</Text>
            <Text style={[styles.toggleLabel, slipped === true && styles.toggleLabelSlipped]}>
              I Slipped
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        {selectedHabit ? (
          <>
            <Text style={styles.label} nativeID="valueLabel">
              Amount ({selectedHabit.goal_unit ?? 'times'}) — optional
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`e.g. ${selectedHabit.daily_goal ?? 30}`}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              accessibilityLabel="Amount"
              accessibilityLabelledBy="valueLabel"
              accessibilityHint={`Enter how many ${selectedHabit.goal_unit ?? 'times'}`}
              editable={!submitting}
            />
          </>
        ) : null}

        {/* Intensity */}
        <Text style={styles.label}>Urge intensity (1–5)</Text>
        <IntensitySelector value={intensity} onChange={setIntensity} />

        {/* Notes */}
        <Text style={styles.label} nativeID="notesLabel">
          Notes (optional)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="How are you feeling? What triggered it?"
          value={notes}
          onChangeText={setNotes}
          maxLength={1000}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Notes"
          accessibilityLabelledBy="notesLabel"
          editable={!submitting}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityLabel="Save log entry"
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" accessibilityLabel="Saving…" />
          ) : (
            <Text style={styles.submitBtnText}>Save Log</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 2 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 13 },
  habitScroll: { gap: 8, paddingBottom: 4 },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    maxWidth: 180,
  },
  habitChipSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextSelected: { color: '#4F46E5', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  toggleBtnResist: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  toggleBtnSlipped: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  toggleEmoji: { fontSize: 24 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  toggleLabelResist: { color: '#059669' },
  toggleLabelSlipped: { color: '#D97706' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    color: '#111827',
  },
  textArea: { minHeight: 88, textAlignVertical: 'top', marginTop: 0 },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  intensityBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  intensityBtnText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  intensityBtnTextActive: { color: '#4F46E5' },
  intensityLabel: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4, marginBottom: 4 },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
