import { View, Text, StyleSheet } from 'react-native';

interface Props {
  streak: number;
  size?: 'sm' | 'md';
}

/**
 * Displays a flame streak badge.
 * Turns grey when streak === 0, orange when active.
 */
export function StreakBadge({ streak, size = 'md' }: Props) {
  const isActive = streak > 0;
  const isSmall = size === 'sm';

  return (
    <View
      style={[styles.badge, isActive ? styles.activeBadge : styles.inactiveBadge]}
      accessible
      accessibilityLabel={isActive ? `${streak} day streak` : 'No streak yet'}
    >
      <Text style={isSmall ? styles.emojiSm : styles.emoji}>
        {isActive ? '🔥' : '💤'}
      </Text>
      <Text style={[styles.text, isSmall ? styles.textSm : null, isActive ? styles.activeText : styles.inactiveText]}>
        {isActive ? `${streak}d` : '0d'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 3,
  },
  activeBadge: { backgroundColor: '#FFF7ED' },
  inactiveBadge: { backgroundColor: '#F3F4F6' },
  emoji: { fontSize: 14 },
  emojiSm: { fontSize: 11 },
  text: { fontWeight: '700', fontSize: 13 },
  textSm: { fontSize: 11 },
  activeText: { color: '#EA580C' },
  inactiveText: { color: '#9CA3AF' },
});
