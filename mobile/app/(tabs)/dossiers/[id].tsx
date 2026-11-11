import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Badge, Button, EmptyState, LoadingState } from '../../../src/components/ui';
import { colors, radius } from '../../../src/components/ui/colors';
import { getDossier, listDossierCycles } from '../../../src/services/api';
import { authenticationService } from '../../../src/features/auth';

export default function DossierDetailScreen({
  route,
  params,
}: {
  route: any;
  params: { dossierId: string };
}) {
  const router = useRouter();
  const [dossierId, setDossierId] = useState<string>(params?.dossierId || '');
  const [dossier, setDossier] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [montantRetrait, setMontantRetrait] = useState('');

  const chargerDossier = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [dossierResult, cyclesResult] = await Promise.all([
        getDossier(dossierId),
        listDossierCycles(dossierId),
      ]);
      setDossier(dossierResult);
      setCycles(cyclesResult ?? []);
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : 'Impossible de charger le dossier.',
      );
    } finally {
      setChargement(false);
    }
  }, [dossierId]);

  useEffect(() => {
    void chargerDossier();
  }, [chargerDossier]);

  if (chargement) {
    return <LoadingState message="Chargement des informations du dossier…" />;
  }

  if (erreur) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{erreur}</Text>
        <Button label="Réessayer" onPress={chargerDossier} variant="secondary" />
      </View>
    );
  }

  if (!dossier) {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Dossier introuvable</Text>
        <Text style={styles.sousTitre}>{dossierId}</Text>
        <Button label="Retour" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const montantTotal = Number(dossier.dailyAmountXaf || 0);
  const cycle = cycles[0];
  const installmentCount = cycle?.installmentCount ?? 0;
  const totalCollected = Number(cycle?.totalCollectedXaf ?? 0);
  const montantVersé = totalCollected;
  const montantRestant = Math.max(0, montantTotal - montantVersé);
  const totalVersements = installmentCount;
  const versementsRestants = Math.max(0, 31 - totalVersements);
  const pourcentageCompletion = (totalVersements / 31) * 100;
  const peutPrendreRetrait = totalVersements > 0;
  const statutDossier = dossier.status === 'OPEN' ? 'Ouvert' : 'Clôturé';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Dossier {dossier.dossierNo}</Text>
          <Text style={styles.subtitle}>
            Client: {dossier.client ? `${dossier.client.firstName} ${dossier.client.lastName}` : '—'}
          </Text>
        </View>
        <Badge kind={dossier.status === 'OPEN' ? 'confirme' : 'erreur'} label={statutDossier} />
      </View>

      <View style={styles.progressionBox}>
        <Text style={styles.progressionTitre}>Progression des versements</Text>
        <View style={styles.progressionDetails}>
          <Text style={styles.progressionLigne1}>
            {totalVersements} / 31 versements{' '}
            {versementsRestants > 0 ? (
              <Text style={styles.badgeStyle}>{versementsRestants} restants</Text>
            ) : (
              <Text style={styles.badgeStyle}>Terminés</Text>
            )}
          </Text>
          <Text style={styles.progressionLigne2}>
            {montantVersé} FCFA versés / {montantTotal} FCFA fixés
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Montants</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Montant fixe par versement</Text>
          <Text style={styles.fieldValue}>{montantTotal} FCFA</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Total versé</Text>
          <Text style={styles.fieldValue}>{montantVersé} FCFA</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Restant à verser</Text>
          <Text style={styles.fieldValue}>{montantRestant} FCFA</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des versements ({cycles.length}/31)</Text>
        {cycles.length === 0 ? (
          <Text style={styles.emptyText}>Aucun versement enregistré pour ce dossier.</Text>
        ) : (
          <FlatList
            data={cycles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cycleItem}>
                <Text style={styles.cycleDate}>{new Date(item.occurredAt).toLocaleDateString('fr-FR')}</Text>
                <Text style={styles.cycleAmount}>{item.amountXaf} FCFA</Text>
                <Text style={styles.cycleType}>{item.type === 'DEPOSIT' ? 'Versement' : item.type}</Text>
              </View>
            )}
            contentContainerStyle={styles.flatListContainer}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut du dossier</Text>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Type:</Text>
          <Text style={styles.statusValue}>{dossier.status}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Marché:</Text>
          <Text style={styles.statusValue}>{dossier.marketName || 'Non défini'}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Agent collecteur:</Text>
          <Text style={styles.statusValue}>{dossier.collectionAgentId ? 'Assigné' : 'Non assigné'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {peutPrendreRetrait && (
          <Pressable style={styles.boutonRetrait} onPress={() => setShowWithdrawalModal(true)}>
            <Text style={styles.boutonText}>Demander un retrait</Text>
          </Pressable>
        )}
        {dossier.status !== 'OPEN' && (
          <Text style={styles.infoCloture}>Cycle clôturé, aucun retrait possible</Text>
        )}
        {!peutPrendreRetrait && dossier.status === 'OPEN' && (
          <Text style={styles.infoAucunVersement}>Aucun versement encore, impossible de retirer</Text>
        )}
      </View>

      {showWithdrawalModal && (
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowWithdrawalModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Demande de retrait</Text>
            <Text style={styles.modalSubtitle}>Montant disponible : {montantRestant} FCFA</Text>
            <Text style={styles.modalNote}>
              Montant du retrait + commission (1 versement) ne doit pas dépasser le solde.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant du retrait (FCFA)</Text>
              <TextInput
                value={montantRetrait}
                onChangeText={setMontantRetrait}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.modalActions}>
              <Button label="Annuler" onPress={() => setShowWithdrawalModal(false)} variant="secondary" />
              <Button
                label="Valider retrait"
                onPress={() => {
                  setShowWithdrawalModal(false);
                  alert('Demande soumise (validation serveur)');
                }}
                variant="primary"
              />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  headerLeft: { gap: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14 },
  errorContainer: { padding: 24, gap: 12, alignItems: 'center' },
  errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  errorMessage: { color: colors.text, fontSize: 14, textAlign: 'center' },
  titre: { color: colors.text, fontSize: 24, fontWeight: '700' },
  sousTitre: { color: colors.muted, fontSize: 14 },
  progressionBox: { marginBottom: 20 },
  progressionTitre: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  progressionDetails: { gap: 4 },
  progressionLigne1: { color: colors.text, fontSize: 14 },
  progressionLigne2: { color: colors.muted, fontSize: 13 },
  badgeStyle: { color: colors.primary, fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { color: colors.muted, fontSize: 12 },
  fieldValue: { color: colors.text, fontSize: 14 },
  emptyText: { color: colors.muted, fontSize: 14 },
  cycleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cycleDate: { color: colors.muted, fontSize: 12 },
  cycleAmount: { color: colors.text, fontSize: 14 },
  cycleType: { color: colors.primary, fontSize: 12 },
  flatListContainer: { paddingVertical: 4 },
  statusInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusLabel: { color: colors.muted, fontSize: 12 },
  statusValue: { color: colors.text, fontSize: 14 },
  actions: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  boutonRetrait: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md },
  boutonText: { color: '#FFFFFF', fontWeight: '700' },
  infoCloture: { color: colors.danger, fontSize: 14 },
  infoAucunVersement: { color: colors.muted, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, width: '100%', maxWidth: 320 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalSubtitle: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  modalNote: { color: colors.danger, fontSize: 12, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: colors.background, padding: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  modalActions: { flexDirection: 'row', gap: 8 },
});
