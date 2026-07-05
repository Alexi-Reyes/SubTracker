import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { BillingCycle, Tracker } from '../../../types';

export default function TrackerDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notifyDatetime, setNotifyDatetime] = useState<Date | null>(null);
  const [showNotifyPicker, setShowNotifyPicker] = useState(false);
  const [notifyMode, setNotifyMode] = useState<'date' | 'time'>('date');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['tracker', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('trackers').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      
      setName(data.name);
      setPrice(data.price.toString());
      setCurrency(data.currency);
      setCycle(data.cycle);
      setDate(new Date(data.next_billing_date));
      setNotifyDatetime(data.notify_datetime ? new Date(data.notify_datetime) : null);
      setUrl(data.url || '');
      setNotes(data.notes || '');
      
      return data as Tracker;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('trackers').update({
        name,
        price: parseFloat(price),
        currency,
        cycle,
        next_billing_date: date.toISOString().split('T')[0],
        notify_datetime: notifyDatetime ? notifyDatetime.toISOString() : null,
        url: url || null,
        notes: notes || null,
      }).eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
      queryClient.invalidateQueries({ queryKey: ['tracker', id] });
      Alert.alert('Succès', 'Abonnement mis à jour');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Erreur', error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('trackers').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Erreur', error.message);
    }
  });

  const handleUpdate = () => {
    if (!name || !price || !date) return;
    updateMutation.mutate();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' || Platform.OS === 'ios') setDate(currentDate);
  };

  const onNotifyChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || notifyDatetime || new Date();
    if (Platform.OS === 'android') setShowNotifyPicker(false);
    
    if (event.type === 'set' || Platform.OS === 'ios') {
      setNotifyDatetime(currentDate);
      if (Platform.OS === 'android' && notifyMode === 'date') {
        setNotifyMode('time');
        setShowNotifyPicker(true);
      }
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmation', 'Voulez-vous vraiment supprimer cet abonnement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() }
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!tracker) {
    return (
      <View style={styles.center}>
        <Text>Abonnement introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom de l'abonnement</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#999" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prix</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#999" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Monnaie</Text>
        <View style={styles.buttonRow}>
          {['EUR', 'USD'].map((c) => (
            <TouchableOpacity key={c} style={[styles.choiceBtn, currency === c && styles.choiceBtnActive]} onPress={() => setCurrency(c)}>
              <Text style={[styles.choiceText, currency === c && styles.choiceTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Cycle de facturation</Text>
        <View style={styles.buttonRow}>
          {(['weekly', 'monthly', 'yearly'] as BillingCycle[]).map((cy) => (
            <TouchableOpacity key={cy} style={[styles.choiceBtn, cycle === cy && styles.choiceBtnActive]} onPress={() => setCycle(cy)}>
              <Text style={[styles.choiceText, cycle === cy && styles.choiceTextActive]}>{cy}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prochain paiement (YYYY-MM-DD)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: '#000', fontSize: 16 }}>{date.toISOString().split('T')[0]}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date et heure de notification (Optionnel)</Text>
        <TouchableOpacity style={styles.input} onPress={() => { setNotifyMode('date'); setShowNotifyPicker(true); }}>
          <Text style={{ color: notifyDatetime ? '#000' : '#999', fontSize: 16 }}>
            {notifyDatetime ? notifyDatetime.toLocaleString() : "Appuyez pour définir"}
          </Text>
        </TouchableOpacity>
        {showNotifyPicker && (
          <DateTimePicker 
            value={notifyDatetime || new Date()} 
            mode={Platform.OS === 'ios' ? 'datetime' : notifyMode} 
            display="default" 
            onChange={onNotifyChange} 
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>URL (Optionnel)</Text>
        <TextInput style={styles.input} value={url} onChangeText={setUrl} placeholder="Ex: https://netflix.com" placeholderTextColor="#999" autoCapitalize="none" keyboardType="url" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes (Optionnel)</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Informations supplémentaires..." placeholderTextColor="#999" multiline />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleteMutation.isPending || updateMutation.isPending}>
          {deleteMutation.isPending ? <ActivityIndicator color="#fff" /> : <Ionicons name="trash-outline" size={24} color="#fff" />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={deleteMutation.isPending || updateMutation.isPending}>
          {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  choiceBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  choiceText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  choiceTextActive: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
