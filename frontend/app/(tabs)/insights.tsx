import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchWeeklyInsights } from '@/lib/insights';
import { WeeklyInsight } from '@/types';

export default function InsightsScreen() {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchWeeklyInsights();
      setInsight(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate weekly insights');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [])
  );

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInsights} />}
    >
      <Text style={styles.title} accessibilityRole="header">Your Weekly Report</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading && !insight ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>AI is analyzing your week...</Text>
        </View>
      ) : insight ? (
        <View style={styles.reportContainer}>
          <Text style={styles.dateRange}>
            Week of {new Date(insight.week_start).toLocaleDateString()}
          </Text>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <Text style={styles.summary}>{insight.summary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {insight.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.recommendationText}>{rec.replace(/^- /, '')}</Text>
              </View>
            ))}
            {insight.recommendations.length === 0 && (
              <Text style={styles.recommendationText}>No specific recommendations this week.</Text>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>No insights available.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  dateRange: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  loadingContainer: { padding: 32, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#4B5563' },
  errorContainer: { padding: 16, backgroundColor: '#FEF2F2', borderRadius: 8 },
  errorText: { color: '#EF4444' },
  reportContainer: {},
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  summary: { fontSize: 16, color: '#374151', lineHeight: 24 },
  recommendationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: { fontSize: 18, color: '#4F46E5', marginRight: 8, lineHeight: 22 },
  recommendationText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 32 },
});
