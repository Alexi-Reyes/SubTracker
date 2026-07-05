import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Tracker } from '../../types';

export default function PrivateIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: trackers = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['trackers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trackers')
        .select('*')
        .order('next_billing_date', { ascending: true });
      
      if (error) {
        throw new Error(error.message);
      }
      return data as Tracker[];
    },
    enabled: !!user,
  });

  const renderItem = ({ item }: { item: Tracker }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(private)/tracker/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardPrice}>{item.price} {item.currency}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardCycle}>{item.cycle}</Text>
        <Text style={styles.cardDate}>Prochain paiement: {new Date(item.next_billing_date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {trackers.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="documents-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucun abonnement trouvé.</Text>
        </View>
      ) : (
        <FlatList
          data={trackers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { bottom: Math.max(insets.bottom + 24, 24) }]}
        onPress={() => router.push('/(private)/tracker/add')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCycle: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  cardDate: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
