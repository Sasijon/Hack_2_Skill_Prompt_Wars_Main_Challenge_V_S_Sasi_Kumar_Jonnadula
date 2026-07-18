/**
 * Add Habit screen — presented as a modal.
 * Route: /habit/add
 * Also serves as the edit screen when ?id=<habitId> is passed.
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
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { HabitCategory, CreateHabitPayload } from '@/types';
import { createHabit, updateHabit, fetchHabit } from '@/lib/habits';
import { CATEGORIES, CATEGORY_META } from '@/lib/habitMeta';

interface FormErrors {
  name?: string;
  daily_goal?: string;
  general?: string;
}

export default function AddHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('screen_time');
  const [dailyGoal, setDailyGoal] = useState('');
  const [goalUnit, setGoalUnit] = useState('minutes');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Load existing habit when editing
  useEffect(() => {
    if (!id) return;
    fetchHabit(id)
      .then((h) => {
        setName(h.name);
        setDescription(h.description ?? '');
        setCategory(h.category);
        setDailyGoal(h.daily_goal?.toString() ?? '');
        setGoalUnit(h.goal_unit ?? CATEGORY_META[h.category].defaultUnit);
      })
      .catch(() => {
        Alert.alert('Error', 'Could not load habit.');
        router.back();
      })
      .finally(() => setInitialLoading(false));
  }, [id]);

  // Sync default unit when category changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setGoalUnit(CATEGORY_META[category].defaultUnit);
    }
  }, [category, isEditing]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Habit name is required.';
    else if (name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.';

    if (dailyGoal && (isNaN(Number(dailyGoal)) || Number(dailyGoal) < 0)) {
      errs.daily_goal = 'Daily goal must be a positive number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const payload: CreateHabitPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      daily_goal: dailyGoal ? Number(dailyGoal) : undefined,
      goal_unit: goalUnit || undefined,
    };

    try {
      if (isEditing && id) {
        await updateHabit(id, payload);
      } else {
        await createHabit(payload);
      }
      router.back();
    } catch (err: any) {
      setErrors({ general: err?.message ?? 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" accessibilityLabel="Loading habit" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {isEditing ? 'Edit Habit' : 'Add a Habit'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {errors.general ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <Text style={styles.errorBannerText} accessibilityRole="alert">
              {errors.general}
            </Text>
          </View>
        ) : null}

        {/* Habit name */}
        <Text style={styles.label} nativeID="habitNameLabel">
          Habit name *
        </Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          placeholder="e.g. Reduce Instagram to 30 min/day"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          maxLength={100}
          accessibilityLabel="Habit name"
          accessibilityLabelledBy="habitNameLabel"
          returnKeyType="next"
          editable={!loading}
        />
        {errors.name ? (
          <Text style={styles.fieldError} accessibilityRole="alert">{errors.name}</Text>
        ) : null}

        {/* Description */}
        <Text style={styles.label} nativeID="habitDescLabel">
          Description (optional)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Why do you want to break this habit?"
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Habit description"
          accessibilityLabelledBy="habitDescLabel"
          editable={!loading}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid} accessibilityLabel="Select category">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const selected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                onPress={() => setCategory(cat)}
                accessibilityRole="radio"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected }}
                disabled={loading}
              >
                <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily goal */}
        <Text style={styles.label} nativeID="goalLabel">
          {CATEGORY_META[category].defaultGoalLabel} (optional)
        </Text>
        <View style={styles.goalRow}>
          <TextInput
            style={[styles.input, styles.goalInput, errors.daily_goal ? styles.inputError : null]}
            placeholder="e.g. 30"
            value={dailyGoal}
            onChangeText={(v) => {
              setDailyGoal(v);
              if (errors.daily_goal) setErrors((e) => ({ ...e, daily_goal: undefined }));
            }}
            keyboardType="numeric"
            accessibilityLabel="Daily goal amount"
            accessibilityLabelledBy="goalLabel"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.unitInput]}
            placeholder="unit"
            value={goalUnit}
            onChangeText={setGoalUnit}
            maxLength={20}
            accessibilityLabel="Goal unit, e.g. minutes or times"
            editable={!loading}
          />
        </View>
        {errors.daily_goal ? (
          <Text style={styles.fieldError} accessibilityRole="alert">{errors.daily_goal}</Text>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityLabel={isEditing ? 'Save changes' : 'Add habit'}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" accessibilityLabel={isEditing ? 'Saving…' : 'Adding habit…'} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEditing ? 'Save Changes' : 'Add Habit'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F9FAFB',
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  closeBtn: { fontSize: 20, color: '#6B7280', fontWeight: '400' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    marginBottom: 4,
    color: '#111827',
  },
  textArea: {
    minHeight: 88,
    marginBottom: 12,
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 10,
    marginLeft: 2,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: { color: '#DC2626', fontSize: 14 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryBtn: {
    flexBasis: '47%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  categoryBtnSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: { fontSize: 13, fontWeight: '500', color: '#374151' },
  categoryLabelSelected: { color: '#4F46E5', fontWeight: '700' },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalInput: { flex: 2 },
  unitInput: { flex: 1 },
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
