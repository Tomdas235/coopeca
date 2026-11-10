import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Badge, Button, EmptyState, LoadingState } from '../../src/components/ui';
import { colors } from '../../src/components/ui/colors';
import { getDossier, listDossierCycles } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';

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

  const chargerDossier = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const session = await authenticationService.getCurrentSession();
      const branchId = session?.user?.branches?.[0]?.id;
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
        <Text style={styles.sousTitre} dossierId={dossierId} />
        <Button label="Retour" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Dossier {dossier.dossierNo}</Text>
          <Text style={styles.subtitle}>Client: {dossier.client?.fullName}</Text>
        </View>

        <Badge kind={dossier.status === 'OPEN' ? 'confirme' : 'erreur'} label={statutDossier} />
      </View>

      <View style={styles.progressionBox}>
        <Text style={styles.progressionTitre}>Progression des versements</Text>
        <ProgressBar value={pourcentageCompletion / 100} style="bar" color={colors.primary} />
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

      <View style={styles.section}><Text style={styles.sectionTitle}>Montants</Text>
        <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Montant fixe par versement</Text><Text style={styles.fieldValue}>{montantTotal} FCFA</Text></View>
        <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Total versé</Text><Text style={styles.fieldValue}>{montantVersé} FCFA</Text></View>
        <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Restant à verser</Text><Text style={styles.fieldValue}>{montantRestant} FCFA</Text></View>
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Historique des versements ({cycles.length}/31)</Text>
        {cycles.length === 0 ? (
          <Text style={styles.emptyText}>Aucun versement enregistré pour ce dossier.</Text>
        ) : (
          <FlatList data={cycles} keyExtractor={(item) => item.id} renderItem={({ item }) => (
            <View style={styles.cycleItem}><Text style={styles.cycleDate}>{new Date(item.occurredAt).toLocaleDateString('fr-FR')}</Text><Text style={styles.cycleAmount}>{item.amountXaf} FCFA</Text><Text style={styles.cycleType}>{item.type === 'DEPOSIT' ? 'Versement' : item.type}</Text></View>
          )} contentContainerStyle={styles.flatListContainer} />
        )}
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Statut du dossier</Text>
        <View style={styles.statusInfo}><Text style={styles.statusLabel}>Type:</Text><Text style={styles.statusValue}>{dossier.status}</Text></View>
        <View style={styles.statusInfo}><Text style={styles.statusLabel}>Marché:</Text><Text style={styles.statusValue}>{dossier.marketName || 'Non défini'}</Text></View>
        <View style={styles.statusInfo}><Text style={styles.statusLabel}>Agent collecteur:</Text><Text style={styles.statusValue}>{dossier.collectionAgentId ? 'Assigné' : 'Non assigné'}</Text></View>
      </View>

      <View style={styles.actions}>
        {peutPrendreRetrait && (
          <Pressable style={styles.boutonRetrait} onPress={() => setShowWithdrawalModal(true)}>
            <Text style={styles.boutonText}>Demander un retrait</Text>
          </Pressable>
        )}
        {dossier.status !== 'OPEN' && <Text style={styles.infoCloture}>Cycle clôturé, aucun retrait possible</Text>}
        {!peutPrendreRetrait && dossier.status === 'OPEN' && <Text style={styles.infoAucunVersement}>Aucun versement encore, impossible de retirer</Text>}
      </View>

      {showWithdrawalModal && (
        <View style={styles.modalOverlay} onPress={() => setShowWithdrawalModal(false)}>
          <View style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Demande de retrait</Text>
            <Text style={styles.modalSubtitle}>Montant disponible : {montantRestant} FCFA</Text>
            <Text style={styles.modalNote}>Montant du retrait + commission (1 versement) ne doit pas dépasser le solde.</Text>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Montant du retrait (FCFA)</Text><TextInput value={montantRetrait} onChangeText={setMontantRetrait} keyboardType="number-pad" style={styles.input} /></View>
            <View style={styles.modalActions}><Button title="Annuler" onPress={() => setShowWithdrawalModal(false)} variant="outline" /><Button title="Valider retrait" onPress={() => { setShowWithdrawalModal(false); alert('Demande soumise (validation serveur)'); }} variant="primary" /></View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 20 },
  headerLeft: { gap: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14 },
  errorContainer: { padding: 24, gap: 12, alignItems: 'center' },
  errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  errorMessage: { color: colors.text, fontSize: 14, textAlign: 'center' },
});