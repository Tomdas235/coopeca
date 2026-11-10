import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Badge, Button, EmptyState, LoadingState } from '../../../src/components/ui';
import { colors } from '../../../src/components/ui/colors';
import { getClient, listDossiers } from '../../../src/services/api';
import { authenticationService } from '../../../src/features/auth';

export default function ClientDetailScreen({
  route,
  params,
}: {
  route: any;
  params: { clientId: string };
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>(params?.clientId || '');
  const [client, setClient] = useState<any>(null);
  const [dossiers, setDossiers] = useState<any[]>([]);
  
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerClient = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const session = await authenticationService.getCurrentSession();
      const branchId = session?.user?.branchId;
      const [clientResult, dossiersResult] = await Promise.all([
        getClient(clientId),
        listDossiers({ clientId, branchId, limit: 50 }),
      ]);
      setClient(clientResult);
      setDossiers(dossiersResult.items ?? []);
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : 'Impossible de charger le client.',
      );
    } finally {
      setChargement(false);
    }
  }, [clientId]);

  useEffect(() => {
    void chargerClient();
  }, [chargerClient]);

  if (chargement) {
    return <LoadingState message="Chargement des informations du client…" />;
  }

  if (erreur) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{erreur}</Text>
        <Button label="Réessayer" onPress={chargerClient} variant="secondary" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Client introuvable</Text>
        <Text style={styles.sousTitre} clientId={clientId} />
        <Button label="Retour" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const statusKind =
    client.status === 'PROVISIONAL'
      ? 'provisoire'
      : client.status === 'ACTIVE'
        ? 'confirme'
        : 'erreur';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{client.fullName}</Text>
          <Text style={styles.subtitle}>Code: {client.clientCode}</Text>
        </View>

        <Badge kind={statusKind} label={client.status} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du client</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            <Text style={styles.fieldValue}>{client.firstName}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <Text style={styles.fieldValue}>{client.lastName}</Text>
          </View>
          {client.phone && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <Text style={styles.fieldValue}>{client.phone}</Text>
            </View>
          )}
          {client.neighborhood && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Quartier</Text>
              <Text style={styles.fieldValue}>{client.neighborhood}</Text>
            </View>
          )}
          {client.addressDetails && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Adresse</Text>
              <Text style={styles.fieldValue}>{client.addressDetails}</Text>
            </View>
          )}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date de création</Text>
            <Text style={styles.fieldValue}>
              {new Date(client.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut</Text>
          <View style={styles.statusContainer}>
            <Badge kind={statusKind} label={client.status} />
            {client.status === 'PROVISIONAL' && (
              <Text style={styles.statusNote}>
                Nouveau client créé hors ligne, en attente de validation serveur.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dossiers associés ({dossiers.length})</Text>
          {dossiers.length === 0 ? (
            <Text style={styles.emptyText}>Aucun dossier associé.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Modifier" variant="primary" onPress={() => router.push('/(tabs)/clients/nouveau')} />
        <Button label="Consulter dossiers" variant="secondary" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  headerLeft: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  fieldValue: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusNote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    marginVertical: 8,
  },
  actions: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});