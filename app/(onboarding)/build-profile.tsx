import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

const US_STATES = ['AK','AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'];

export default function BuildProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; username?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!username.trim() || username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!/^[a-z0-9_]+$/.test(username)) e.username = 'Username can only contain lowercase letters, numbers, and underscores';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!user || !validate()) return;
    setLoading(true);
    // @ts-expect-error supabase-js v2 Database generic incompatibility with hand-written types
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim() || null,
      location_state: state || null,
      onboarding_done: true,
    }).eq('id', user.id);
    setLoading(false);
    if (error) {
      if (error.code === '23505') {
        setErrors({ username: 'This username is already taken' });
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }
    await refreshProfile();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Build your profile</Text>
        <Text style={styles.subtitle}>Help the community get to know you.</Text>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={errors.fullName}
          />
          <Input
            label="Username"
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
          />
          <View>
            <Text style={styles.label}>State</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateRow}>
              {US_STATES.map((s) => (
                <Button
                  key={s}
                  onPress={() => setState(s === state ? '' : s)}
                  variant={state === s ? 'primary' : 'outline'}
                  size="sm"
                  style={styles.stateBtn}
                >
                  {s}
                </Button>
              ))}
            </ScrollView>
          </View>
          <Input
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholder="Tell us about your running experience, favorite races, what you love about the trails..."
            style={styles.bioInput}
          />
        </View>

        <Button onPress={handleSave} loading={loading} fullWidth size="lg">
          Finish Setup
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.xl, gap: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: -Spacing.sm },
  form: { gap: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: Spacing.xs },
  stateRow: { flexDirection: 'row' },
  stateBtn: { marginRight: Spacing.xs },
  bioInput: { height: 80 },
});
