import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { AuthProvider, useAuth } from "../providers/AuthProvider";

const queryClient = new QueryClient();

function RootNavigator() {
  const { user, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(private)";
    const inPublicGroup = segments[0] === "(public)";

    if (user && !inAuthGroup) {
      router.replace("/(private)/");
    } else if (!user && !inPublicGroup) {
      router.replace("/(public)/sign-in");
    }
  }, [user, initialized, segments]);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(private)" />
      <Stack.Screen name="(public)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
