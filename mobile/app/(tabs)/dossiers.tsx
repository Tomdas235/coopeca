import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar, FolderPlus, RefreshCw, ChevronRight } from 'lucide-react-native';
import { Badge, Button, Card, EmptyState, Input, LoadingState } from '../../src/components/ui';
import { colors, space } from '../../src/components/ui/colors';
import { listDossiers, type DossierListItem } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';

export default function DossiersScreen() {
  const router = useRouter();

  const [dossiers, setDossiers] = useState<DossierListItem[]>([]);
  const [statutFiltre, setStatutFiltre] = useState<'TOUS' | 'OUVERT' | 'FERME'>('TOUS');
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerDossiers = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const session = await authenticationService.getCurrentSession();
      const branchId = session?.user?.branchId;
      const resultat = await listDossiers({
        status: statutFiltre === 'TOUS' ? undefined : statutFiltre,
        branchId,
        limit: 50,
      });
      setDossiers(resultat.items);
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : 'Impossible de charger les dossiers.',
      );
    } finally {
      setChargement(false);
    }
  }, [recherche, statutFiltre]);

  useEffect(() => {
    void chargerDossiers();
  }, [chargerDossiers]);

  if (chargement) {
    return <LoadingState message="Chargement des dossiers…" />;
  }

  if (erreur) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{erreur}</Text>
        <Button label="Réessayer" onPress={chargerDossiers} variant="secondary" />
      </View>
    );
  }

  const dossiersFiltres = dossiers.filter((d) => {
    if (recherche.trim() === '') return true;
    const terme = recherche.toLowerCase();
    return (
      d.dossierNo.toLowerCase().includes(terme) ||
      (d.client?.clientCode?.toLowerCase().includes(terme) ?? false) ||
      (d.client?.fullName?.toLowerCase().includes(terme) ?? false)
    );
  });

  if (dossiersFiltres.length === 0) {
    return (
      <EmptyState
        title="Aucun dossier trouvé"
        message={
          recherche.trim() !== ''
            ? 'Aucun dossier ne correspond à votre recherche.'
            : 'Vous n’avez encore aucun dossier dans votre portefeuille.'
        }
        actionLabel="Nouveau dossier"
        onAction={() => router.push('/(tabs)/dossiers/nouveau')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Dossiers</Text>
          <Text style={styles.subtitle}>
            {dossiersFiltres.length} dossier{dossiersFiltres.length > 1 ? 's' : ''} dans votre portefeuille
          </Text>
        </View>
        <Button
          label="Nouveau dossier"
          variant="primary"
          onPress={() => router.push('/(tabs)/dossiers/nouveau')}
        />
      </View>

      <View style={styles.searchBar}>
        <Input
          label="Rechercher un dossier"
          placeholder="Numéro, client ou code client"
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      <View style={styles.filtres}>
        <Button
          label={
            statutFiltre === 'TOUS'
              ? 'Tous les statuts'
              : statutFiltre === 'OUVERT'
                ? 'Ouverts'
                : 'Fermés'
          }
          variant="secondary"
          onPress={() =>
            setStatutFiltre(
              statutFiltre === 'TOUS'
                ? 'OUVERT'
                : statutFiltre === 'OUVERT'
                  ? 'FERME'
                  : 'TOUS',
            )
          }
        />
        <Button label="Actualiser" variant="ghost" onPress={chargerDossiers} />
      </View>

      <FlatList
        data={dossiersFiltres}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DossierCard item={item} onPress={() => router.push(`/(tabs)/dossiers/${item.id}`)} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function DossierCard({
  item,
  onPress,
}: {
  item: DossierListItem;
  onPress: () => void;
}) {
  const statutLabel =
    item.status === 'OPEN' ? 'OUVERT' : 'FERMÉ';

  return (
    <View style={styles.cardContainer}>
      <Card elevation="sm" padding={14} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfos}>
            <View style={styles.cardNom}>
              <Text style={styles.cardNomTexte}>{item.client?.fullName || 'Client'}</Text>
              <Badge
                kind={item.status === 'OPEN' ? 'confirme' : 'erreur'}
                label={statutLabel}
              />
            </View>
            <Text style={styles.cardCode}>{item.dossierNo}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaTexte}>
                {item.client?.clientCode || '—'}
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
