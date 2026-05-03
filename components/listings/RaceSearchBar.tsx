import React from 'react';
import { View, TextInput, Text, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../constants/theme';
import { formatRaceDate } from '../../lib/utils';
import type { RaceOption } from '../../types/app.types';

interface RaceSearchBarProps {
  query: string;
  onChangeText: (text: string) => void;
  results: RaceOption[];
  loading: boolean;
  searchUnavailable?: boolean;
  onSelect: (race: RaceOption) => void;
  onClear?: () => void;
}

export function RaceSearchBar({
  query,
  onChangeText,
  results,
  loading,
  searchUnavailable,
  onSelect,
  onClear,
}: RaceSearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChangeText}
          placeholder="Search races (e.g. Western States)"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />}
        {!loading && query.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchUnavailable && (
        <Text style={styles.warning}>Live race search unavailable — showing cached results.</Text>
      )}
      {!loading && query.length > 1 && results.length === 0 && (
        <Text style={styles.noResults}>No races found for "{query}"</Text>
      )}

      {results.length > 0 && (
        <ScrollView style={styles.dropdown} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {results.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <View style={styles.separator} />}
              <TouchableOpacity style={styles.resultItem} onPress={() => onSelect(item)} activeOpacity={0.75}>
                <Text style={styles.raceName}>{item.name}</Text>
                <View style={styles.resultMeta}>
                  <Text style={styles.metaText}>
                    {[item.location_city, item.location_state].filter(Boolean).join(', ')}
                  </Text>
                  <Text style={styles.metaText}>{formatRaceDate(item.race_date)}</Text>
                </View>
                {item.distances_json && item.distances_json.length > 0 && (
                  <Text style={styles.distances}>{item.distances_json.join(' · ')}</Text>
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
  },
  input: { flex: 1, height: 48, fontSize: FontSize.md, color: Colors.text },
  spinner: { marginLeft: Spacing.sm },
  clearBtn: { padding: Spacing.sm },
  clearText: { color: Colors.textMuted, fontSize: FontSize.md },
  warning: { fontSize: FontSize.xs, color: Colors.warning, paddingHorizontal: Spacing.xs },
  dropdown: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    ...Shadow.md,
    overflow: 'hidden',
  },
  resultItem: { padding: Spacing.md, gap: Spacing.xs / 2 },
  raceName: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  distances: { fontSize: FontSize.xs, color: Colors.textMuted },
  separator: { height: 1, backgroundColor: Colors.border },
  noResults: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md },
});
