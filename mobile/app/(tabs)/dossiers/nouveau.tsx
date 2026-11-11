import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, FlatList, TouchableOpacity } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  FormField,
  FormError,
  FormSuccess,
  Input,
  LoadingState,
  colors,
  space,
} from '../../../src/components/ui';
import {
  createDossier,
  listClients,
  getProfile,
  ClientListItem,
} from '../../../src/services/api';

type ClientSelectable = ClientListItem & { pressable: boolean };

export default function NouveauDossierScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null);
  const [dailyAmountXaf, setDailyAmountXaf] = useState('');
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [agentId, setAgentId] = useState('');

  const chargerClients = useCallback(async () => {
    try {
      const [profile, clientsResponse] = await Promise.all([
        getProfile(),
        listClients({ status: 'ACTIVE', limit: 50 }),
      ]);
      setAgentId(profile.id);
      setClients(clientsResponse.items.filter((c) => c.status === 'ACTIVE'));
    } catch {
      setError('Impossible de charger les clients.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void chargerClients();
  }, [chargerClients]);

  if (isLoading) {
    return <LoadingState message="Chargement des clients…" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState title="Erreur" message={error} />
        <Button label="Réessayer" onPress={() => void chargerClients()} variant="secondary" />
      </View>
    );
  }

  const clientsSansDossier = clients.filter((c) => !c.branchId);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Ouvrir un dossier</Text>
          <Text style={styles.subtitle}>
            Sélectionnez un client actif et définissez le montant fixe par versement.
          </Text>
        </View>

        {success && <FormSuccess message={success} />}
        {error && <FormError message={error} />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélection du client</Text>
          {clientsSansDossier.length === 0 ? (
            <EmptyState title="Aucun client disponible" message="Aucun client actif sans dossier ouvert n’a été trouvé." />
          ) : (
            <FlatList
              data={clientsSansDossier}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.clientRow,
                    selectedClient?.id === item.id && styles.clientRowSelected,
                  ]}
                  onPress={() => setSelectedClient(item)}
                >
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{item.fullName}</Text>
                    <Text style={styles.clientCode}>{item.clientCode}</Text>
                  </View>
                  {selectedClient?.id === item.id && (
                    <Text style={styles.clientCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.clientList}
            />
          )}
        </View>

        {selectedClient && (
          <View style={styles.form}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Récapitulatif</Text>
              <Text style={styles.cardText}>
                <Text style={styles.cardLabel}>Client :</Text>{' '}
                {selectedClient.fullName}
              </Text>
              <Text style={styles.cardText}>
                <Text style={styles.cardLabel}>Référence :</Text>{' '}
                {selectedClient.clientCode}
              </Text>
              <Text style={styles.cardText}>
                <Text style={styles.cardLabel}>Agent collecteur :</Text>{' '}
                {agentId}
              </Text>
            </View>

            <FormField label="Montant fixe par versement (XAF)" required error={!dailyAmountXaf || parseInt(dailyAmountXaf, 10) <= 0 ? 'Montant requis et positif.' : null}>
              <Input
                label="Montant"
                value={dailyAmountXaf}
                onChangeText={setDailyAmountXaf}
                keyboardType="numeric"
                placeholder="0"
                accessibilityLabel="Montant fixe par versement"
              />
            </FormField>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="Annuler"
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? 'Création…' : 'Ouvrir le dossier'}
            variant="primary"
            onPress={enregistrerDossier}
            disabled={
              isSubmitting ||
              !selectedClient ||
              !dailyAmountXaf ||
              parseInt(dailyAmountXaf, 10) <= 0
            }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  async function enregistrerDossier() {
    if (!selectedClient) return;
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createDossier({
        clientId: selectedClient.id,
        agentId,
        marketId: selectedClient.marketId || '',
        dailyAmountXaf,
        deviceId: 'mobile-device',
      });
      setSuccess('Le dossier a été ouvert.');
      setDailyAmountXaf('');
      setSelectedClient(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible d’ouvrir le dossier.');
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  clientList: {
    gap: 8,
  },
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  clientRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  clientCode: {
    color: colors.muted,
    fontSize: 13,
  },
  clientCheck: {
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardText: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 6,
  },
  cardLabel: {
    color: colors.primary,
    fontWeight: '700',
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
