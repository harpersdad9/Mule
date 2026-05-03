import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { RaceSearchBar } from '../../../components/listings/RaceSearchBar';
import { useRaceSearch } from '../../../hooks/useRaceSearch';
import { useMyListings } from '../../../hooks/useListings';
import { useAuth } from '../../../lib/auth';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';
import { formatRaceDate } from '../../../lib/utils';
import type { RaceOption, RoleType, RateType } from '../../../types/app.types';

export default function NewListingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createListing } = useMyListings(user?.id);
  const raceSearch = useRaceSearch();

  const [selectedRace, setSelectedRace] = useState<RaceOption | null>(null);
  const [roleType, setRoleType] = useState<RoleType>('pacer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [segmentStart, setSegmentStart] = useState('');
  const [segmentEnd, setSegmentEnd] = useState('');
  const [segmentMiles, setSegmentMiles] = useState('');
  const [rateType, setRateType] = useState<RateType>('flat');
  const [rateAmount, setRateAmount] = useState('');
  const [saving, setSaving] = useState(false);

  function handleRaceSelect(race: RaceOption) {
    setSelectedRace(race);
    raceSearch.clear();
    if (!title) setTitle(`${race.name} ${roleType}`);
  }

  async function handleSave() {
    if (!user || !selectedRace) {
      Alert.alert('Missing info', 'Please select a race.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing info', 'Please add a title.');
      return;
    }
    const amount = parseFloat(rateAmount);
    if (!rateAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Missing info', 'Please enter a valid rate.');
      return;
    }

    setSaving(true);
    const { error } = await createListing({
      user_id: user.id,
      race_id: selectedRace.id,
      role_type: roleType,
      title: title.trim(),
      description: description.trim() || null,
      segment_start: segmentStart.trim() || null,
      segment_end: segmentEnd.trim() || null,
      segment_miles: segmentMiles ? parseFloat(segmentMiles) : null,
      rate_type: rateType,
      rate_amount: Math.round(amount * 100),
      status: 'active',
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      router.replace('/(tabs)/listings');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'New Listing', headerBackTitle: 'Listings' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Race</Text>
        {selectedRace ? (
          <View style={styles.selectedRace}>
            <View style={styles.selectedRaceInfo}>
              <Text style={styles.selectedRaceName}>{selectedRace.name}</Text>
              <Text style={styles.selectedRaceMeta}>{formatRaceDate(selectedRace.race_date)}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedRace(null)}>
              <Text style={styles.changeBtn}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <RaceSearchBar
            query={raceSearch.query}
            onChangeText={raceSearch.search}
            results={raceSearch.races}
            loading={raceSearch.loading}
            searchUnavailable={raceSearch.searchUnavailable}
            onSelect={handleRaceSelect}
            onClear={raceSearch.clear}
          />
        )}

        <Text style={styles.sectionLabel}>Your Role</Text>
        <View style={styles.toggleRow}>
          {(['pacer', 'crew'] as RoleType[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, roleType === r && styles.toggleBtnActive]}
              onPress={() => setRoleType(r)}
            >
              <Text style={[styles.toggleText, roleType === r && styles.toggleTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Listing Title" value={title} onChangeText={setTitle} placeholder="e.g. Available to pace miles 60–80" />
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholder="Your experience, what you bring, availability details..."
          style={styles.textArea}
        />

        <Text style={styles.sectionLabel}>Segment</Text>
        <View style={styles.row}>
          <Input label="Start (aid station or mile)" value={segmentStart} onChangeText={setSegmentStart} containerStyle={styles.half} />
          <Input label="End" value={segmentEnd} onChangeText={setSegmentEnd} containerStyle={styles.half} />
        </View>
        <Input
          label="Miles (optional)"
          value={segmentMiles}
          onChangeText={setSegmentMiles}
          keyboardType="numeric"
          placeholder="e.g. 20"
          containerStyle={styles.halfInput}
        />

        <Text style={styles.sectionLabel}>Rate</Text>
        <View style={styles.toggleRow}>
          {(['flat', 'hourly'] as RateType[]).map((rt) => (
            <TouchableOpacity
              key={rt}
              style={[styles.toggleBtn, rateType === rt && styles.toggleBtnActive]}
              onPress={() => setRateType(rt)}
            >
              <Text style={[styles.toggleText, rateType === rt && styles.toggleTextActive]}>
                {rt === 'flat' ? 'Flat fee' : 'Per hour'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label={`Amount ($) ${rateType === 'hourly' ? 'per hour' : 'total'}`}
          value={rateAmount}
          onChangeText={setRateAmount}
          keyboardType="numeric"
          placeholder="e.g. 150"
          containerStyle={styles.halfInput}
        />

        <Button onPress={handleSave} loading={saving} fullWidth size="lg" style={styles.saveBtn}>
          Publish Listing
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.sm },
  selectedRace: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  selectedRaceInfo: { flex: 1 },
  selectedRaceName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  selectedRaceMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  changeBtn: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surface },
  toggleBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  toggleText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: Colors.primary, fontWeight: '600' },
  textArea: { height: 80 },
  row: { flexDirection: 'row', gap: Spacing.md },
  half: { flex: 1 },
  halfInput: { width: '50%' },
  saveBtn: { marginTop: Spacing.md },
});
