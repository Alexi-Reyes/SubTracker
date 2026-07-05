import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import { BillingCycle } from '../../../types';

export default function AddTracker() {
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
  
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('trackers').insert({
        user_id: user?.id,
        name,
        price: parseFloat(price),
        currency,
        cycle,
        next_billing_date: date.toISOString().split('T')[0],
        notify_datetime: notifyDatetime ? notifyDatetime.toISOString() : null,
        url: url || null,
        notes: notes || null,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Erreur', error.message);
    }
  });

  const handleSave = () => {
    if (!name || !price || !date) {
      Alert.alert('Erreur', 'Veuillez remplir le nom, le prix et la date.');
      return;
    }
    addMutation.mutate();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom de l'abonnement</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Netflix" placeholderTextColor="#999" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prix</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Ex: 15.99" keyboardType="numeric" placeholderTextColor="#999" />
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={addMutation.isPending}>
        {addMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Ajouter</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  saveBtn: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
