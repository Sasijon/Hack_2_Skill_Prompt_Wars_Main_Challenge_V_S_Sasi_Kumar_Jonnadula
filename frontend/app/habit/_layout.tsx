import { Stack } from 'expo-router';

export default function HabitLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F9FAFB' },
        // Present add/edit as a modal on iOS; slide on Android
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]" options={{ presentation: 'card' }} />
    </Stack>
  );
}
