import { Redirect } from 'expo-router';

// Root index redirects to the tabs group (auth guard in _layout handles unauthenticated users)
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
