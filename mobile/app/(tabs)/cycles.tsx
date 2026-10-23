import { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import { listMarkets, depositToCycle } from '../../src/services/api';

export default function CyclesScreen() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [cycleSelectionne, setCycleSelectionne] = useState<any | null>(null);
  const [nouveauCycle, setNouveauCycle] = useState<{ code: string; name: string; fixedAmountXaf: number } | null>(null);
  const [montantDepot, setMontantDepot] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [encours, setEncours] = useState(false);

  useEffect(() => {
    chargerMarkets();
  }, []);

  async function chargerMarkets() {
    try {
      setChargement(true);
      const liste = await listMarkets();
      setMarkets(liste.data || []);
    } catch (e) {
      setMarkets([]);
    } finally {
      setChargement(false);
    }
  }

  async function ouvrirNouveauCycle() {
    if (!nouveauCycle?.code || !nouveauCycle?.name || nouveauCycle.fixedAmountXaf <= 0) return;
    setEncours(true);
    try {
      await setMarketActive(nouveauCycle.code, true);
      await chargerMarkets();
      setDialogVisible(true);
      setNouveauCycle(null);
      setMontantDepot('');
    } catch (e) {
      // Erreur
    } finally {
      setEncours(false);
    }
  }

  async function faireDepot() {
    if (!cycleSelectionne || !montantDepot || parseInt(montantDepot) <= 0) return;
    const amount = parseInt(montantDepot);
    setEncours(true);
    try {
      await depositToCycle(cycleSelectionne.id, amount);
      setMontantDepot('');
      setDialogVisible(true);
    } catch (e) {
      // Erreur de dépôt
    } finally {
      setEncours(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COOPECA · CYCLES</Text>
        <Text accessibilityRole="header" style={styles.title}>Mes cycles actifs</Text>
        <Text style={styles.subtitle}>Cycle à 31 versements</Text>
      </View>
      <SyncStatusBanner />
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Nouveau cycle</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Code</Text>
          <TextInput style={styles.input} placeholder="MARQUE-01" onChangeText={(t) => setNouveauCycle(prev => ({ ...prev, code: t }))} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom</Text>
          <TextInput style={styles.input} placeholder="Marché Centre-Ouest" onChangeText={(t) => setNouveauCycle(prev => ({ ...prev, name: t }))} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Montant/XAF</Text>
          <TextInput style={styles.input} keyboardType="number" onChangeText={(t) => setNouveauCycle(prev => ({ ...prev, fixedAmountXaf: parseInt(t) || 0 }))} />
        </View>
        <View style={{ padding: 8, marginTop: 6 }}>
          <Text style={{ color: colors.accent, fontSize: 10 }}>31 versements × montant = total. Commission = 1 versement.</Text>
        </View>
        <AppButton label="Créer" color="accent" onPress={ouvrirNouveauCycle} disabled={encours} />
      </AppCard>
      <View style={styles.section} marginTop={16}>
        <Text style={styles.sectionTitle}>Cycles</Text>
        {chargement ? (<ActivityIndicator size="large" />) : markets.length === 0 ? (<Text> Aucun cycle créé encore. Créez-en un ci-dessus.</Text>) : markets.map((m) => (<Pressable key={m.id} onPress={() => setCycleSelectionne(m)} style={ { padding: 8, marginBottom: 8, background: colors.surface, borderRadius: 6 } }><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: colors.accent, fontWeight: '700' }}>{m.code}</Text><Text>{m.name}</Text></View></Pressable>))}
      </View>
      {cycleSelectionne && (<AppNotice title="Sélectionné" body={`Cycle ${cycleSelectionne.code}`} kind="info" />)}
      {dialogVisible && (<AppNotice title="Terminé" body="Opération effectuée avec succès" kind="success" />)}
    </AppScreen>
  );
}