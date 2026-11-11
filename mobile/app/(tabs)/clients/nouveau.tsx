import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  FormField,
  FormError,
  FormSuccess,
  Input,
  Select,
  LoadingState,
  colors,
} from '../../../src/components/ui';
import { createClient, listMarkets, getProfile } from '../../../src/services/api';
import { authenticationService } from '../../../src/features/auth';

export default function NouveauClientScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [branchId, setBranchId] = useState('');
  const [marketId, setMarketId] = useState('');

  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [markets, setMarkets] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [agentId, setAgentId] = useState('');

  const chargerReferences = useCallback(async () => {
    try {
      const [profile, marketsList] = await Promise.all([
        getProfile(),
        listMarkets(),
      ]);
      setBranches(profile.branches);
      setMarkets(marketsList);
      setAgentId(profile.id);
      if (profile.branches.length > 0 && !branchId) {
        setBranchId(profile.branches[0].id);
      }
    } catch {
      setError('Impossible de charger les agences et marchés.');
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void chargerReferences();
  }, [chargerReferences]);

  if (isLoading) {
    return <LoadingState message="Chargement des agences et marchés…" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState title="Erreur" message={error} />
        <Button label="Réessayer" onPress={() => void chargerReferences()} variant="secondary" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouveau client</Text>
          <Text style={styles.subtitle}>
            Créez un client avec le statut PROVISIONAL. La référence client est générée automatiquement.
          </Text>
        </View>

        {success && <FormSuccess message={success} />}
        {error && <FormError message={error} />}

        <View style={styles.form}>
          <FormField label="Prénom" required error={!firstName ? 'Ce champ est requis.' : null}>
            <Input
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom du client"
              accessibilityLabel="Prénom"
            />
          </FormField>
          <FormField label="Nom" required error={!lastName ? 'Ce champ est requis.' : null}>
            <Input
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom du client"
              accessibilityLabel="Nom"
            />
          </FormField>
          <FormField label="Téléphone">
            <Input
              label="Téléphone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              placeholder="+225 XX XX XX XX"
              accessibilityLabel="Téléphone"
            />
          </FormField>
          <FormField label="Quartier">
            <Input
              label="Quartier"
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Quartier"
              accessibilityLabel="Quartier"
            />
          </FormField>
          <FormField label="Adresse">
            <Input
              label="Adresse"
              value={addressDetails}
              onChangeText={setAddressDetails}
              placeholder="Adresse détaillée"
              accessibilityLabel="Adresse"
            />
          </FormField>
          <FormField label="Agence" required error={!branchId ? 'Ce champ est requis.' : null}>
            <Select
              label="Agence"
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => ({ label: `${b.code} — ${b.name}`, value: b.id }))}
            />
          </FormField>
          <FormField label="Marché">
            <Select
              label="Marché"
              value={marketId}
              onChange={setMarketId}
              options={markets.map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))}
            />
          </FormField>
        </View>

        <View style={styles.actions}>
          <Button
            label="Annuler"
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? 'Création…' : 'Créer le client'}
            variant="primary"
            onPress={enregistrerClient}
            disabled={isSubmitting || !firstName || !lastName || !branchId}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  async function enregistrerClient() {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createClient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        neighborhood: neighborhood.trim() || null,
        addressDetails: addressDetails.trim() || null,
        branchId,
        marketId: marketId || undefined,
        collectionAgentId: agentId,
      });
      setSuccess('Le client a été créé avec le statut PROVISIONAL.');
      setFirstName('');
      setLastName('');
      setPhone('');
      setNeighborhood('');
      setAddressDetails('');
      setBranchId(branches.length > 0 ? branches[0].id : '');
      setMarketId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le client.');
    } finally {
      setIsSubmitting(false);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});
