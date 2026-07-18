import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, label }: { emoji: string; label: string }) {
  return <Text style={{ fontSize: 20 }} accessibilityLabel={label}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎯" label="Habits tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📝" label="Log tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Coach',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="AI Coach tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Insights tab" />
          ),
        }}
      />
      <Tabs.Screen
        name="nudges"
        options={{
          title: 'Nudges',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" label="Nudges tab" />
          ),
        }}
      />
    </Tabs>
  );
}
