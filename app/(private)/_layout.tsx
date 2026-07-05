import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function PrivateLayout() {
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Mes Abonnements',
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={{ marginRight: 15 }}>
              <Ionicons name="log-out-outline" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }} 
      />
      <Stack.Screen 
        name="tracker/add" 
        options={{ 
          title: 'Nouvel Abonnement',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="tracker/[id]" 
        options={{ 
          title: 'Détails',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}
