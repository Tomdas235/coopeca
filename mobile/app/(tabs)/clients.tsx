import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Search, UserPlus, ChevronRight } from 'lucide-react-native';
import { Badge, Button, Card, EmptyState, Input, LoadingState } from '../../src/components/ui';
import { colors, space } from '../../src/components/ui/colors';
import { listClients, type ClientListItem } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';

export default function ClientsScreen() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [recherche, setRecherche] = useState('');
  const [statutFiltre, setStatutFiltre] = useState<string>('TOUS');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerClients = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const session = await authenticationService.getCurrentSession();
      const branchId = session?.user?.branchId;
      const resultat = await listClients({
        search: recherche.trim() || undefined,
        status: statutFiltre === 'TOUS' ? undefined : statutFiltre,
        branchId,
        limit: 50,
      });
      setClients(resultat.items);
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : 'Impossible de charger les clients.',
      );
    } finally {
      setChargement(false);
    }
  }, [recherche, statutFiltre]);

  useEffect(() => {
    void chargerClients();
  }, [chargerClients]);

  if (chargement) {
    return <LoadingState message="Chargement des clients…" />;
  }

  if (erreur) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{erreur}</Text>
        <Button label="Réessayer" onPress={chargerClients} variant="secondary" />
      </View>
    );
  }

  const clientsFiltres = clients.filter((c) => {
    if (recherche.trim() === '') return true;
    const terme = recherche.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(terme) ||
      c.clientCode.toLowerCase().includes(terme)
    );
  });

  if (clientsFiltres.length === 0) {
    return (
      <EmptyState
        title="Aucun client trouvé"
        message={
          recherche.trim() !== ''
            ? 'Aucun client ne correspond à votre recherche.'
            : 'Vous n’avez encore aucun client dans votre portefeuille.'
        }
        actionLabel="Nouveau client"
        onAction={() => router.push('/(tabs)/clients/nouveau')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>
            {clientsFiltres.length} client{clientsFiltres.length > 1 ? 's' : ''} dans votre portefeuille
          </Text>
        </View>
        <Button
          label="Nouveau client"
          variant="primary"
          onPress={() => router.push('/(tabs)/clients/nouveau')}
        />
      </View>

      <View style={styles.searchBar}>
        <Input
          label="Rechercher un client"
          placeholder="Nom, prénom ou code client"
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      <View style={styles.filtres}>
        <Button
          label={
            statutFiltre === 'TOUS'
              ? 'Tous les statuts'
              : statutFiltre === 'ACTIVE'
                ? 'Actifs'
                : 'Provisoire'
          }
          variant="secondary"
          onPress={() =>
            setStatutFiltre(
              statutFiltre === 'TOUS'
                ? 'ACTIVE'
                : statutFiltre === 'ACTIVE'
                  ? 'PROVISIONAL'
                  : 'TOUS',
            )
          }
        />
        <Button label="Actualiser" variant="ghost" onPress={chargerClients} />
      </View>

      <FlatList
        data={clientsFiltres}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClientCard item={item} onPress={() => router.push(`/(tabs)/clients/${item.id}`)} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function ClientCard({
  item,
  onPress,
}: {
  item: ClientListItem;
  onPress: () => void;
}) {
  const statutLabel =
    item.status === 'PROVISIONAL'
      ? 'PROVISOIRE'
      : item.status === 'ACTIVE'
        ? 'ACTIF'
        : item.status === 'REJECTED'
          ? 'REJETÉ'
          : 'ARCHIVÉ';

  return (
    <View style={styles.cardContainer}>
      <Card elevation="sm" padding={14} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfos}>
            <View style={styles.cardNom}>
              <Text style={styles.cardNomTexte}>{item.fullName}</Text>
              <Badge
                kind={
                  item.status === 'PROVISIONAL'
                    ? 'provisoire'
                    : item.status === 'ACTIVE'
                      ? 'confirme'
                      : 'erreur'
                }
                label={statutLabel}
              />
            </View>
            <Text style={styles.cardCode}>{item.clientCode}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaTexte}>
                {item.branchName || '—'} · {item.marketName || '—'}
              </Text>
              <Text style={styles.cardMetaTexte}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
          <View style={styles.cardAction}>
            <ChevronRight size={16} color={colors.muted} />
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    gap: 8,
  },
  headerLeft: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  searchBar: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  filtres: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  cardContainer: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 88,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardInfos: {
    flex: 1,
    gap: 4,
  },
  cardNom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNomTexte: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardCode: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  cardMetaTexte: {
    color: colors.muted,
    fontSize: 11,
  },
  cardAction: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
});
