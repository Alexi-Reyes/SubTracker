import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { usePushNotifications } from "../hooks/usePushNotifications";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

function NotificationRouter() {
  const response = Notifications.useLastNotificationResponse();
  const router = useRouter();
  const { user, initialized } = useAuth();
  const segments = useSegments();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized || !user) return;
    const inAuthGroup = segments[0] === "(private)";
    if (!inAuthGroup) return;

    if (response && response.notification.request.identifier !== processedRef.current) {
      processedRef.current = response.notification.request.identifier;
      const trackerId = response.notification.request.content.data?.trackerId;
      if (trackerId) {
        setTimeout(() => {
          router.push(`/(private)/tracker/${trackerId}`);
        }, 100);
      }
    }
  }, [response, initialized, user, segments]);

  return null;
}

function RootNavigator() {
  const { user, initialized } = useAuth();
  usePushNotifications(user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(private)";
    const inPublicGroup = segments[0] === "(public)";

    if (user && !inAuthGroup) {
      router.replace("/(private)");
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
        <NotificationRouter />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
