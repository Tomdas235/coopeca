import { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { InputTexte } from '../../src/components/InputTexte';
import { SelecteurSimple } from '../../src/components/SelecteurSimple';
import { StatusPill } from '../../src/components/StatusPill';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import { clientRepository } from '../../src/database/repositories';

/**
 * Écran Clients COOPECA.
 *
 * Permet de consulter la liste des clients de l'agence et d'en créer un nouveau.
 *
 * Règles métier appliquées :
 * - Un client créé hors ligne porte le statut PROVISOIRE jusqu'à acceptation serveur.
 * - Un doublon potentiel (téléphone normalisé + nom/prénom dans la même agence)
 *   déclenche une revue, jamais une fusion automatique.
 * - Aucune donnée métier n'est présentée comme confirmée par le serveur tant
 *   qu'elle n'est pas synchronisée.
 */
export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [agenceId, setAgenceId] = useState('agence-centre');
  const [statut, setStatut] = useState<'PROVISOIRE' | 'CONFIRME'>(
    'PROVISOIRE',
  );
  const [doublonAvertissement, setDoublonAvertissement] = useState<boolean>(
    false,
  );
  const [doublons, setDoublons] = useState<any[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [clientACréer, setClientACréer] = useState<any | null>(null);

  useEffect(() => {
    chargerClients();
  }, []);

  async function chargerClients() {
    try {
      setChargement(true);
      const liste = await clientRepository.findByAgence(agenceId);
      setClients(liste);
    } catch (e) {
      setClients([]);
    } finally {
      setChargement(false);
    }
  }

  async function verifierDoublons() {
    const d = await clientRepository.findDoublonsPotentiels(
      agenceId,
      telephone,
      nom,
      prenom,
    );
    setDoublons(d);
    setDoublonAvertissement(d.length > 0);
  }

  async function creerClient() {
    if (!nom || !prenom || !telephone) return;

    const cleIdempotence = `client-${Date.now()}`;
    const nouveauClient = {
      id: cleIdempotence,
      nom,
      prenom,
      telephone_normalise: telephone,
      statut: 'PROVISOIRE',
      agence_id: agenceId,
      date_creation_declaree: new Date().toISOString(),
      doublon_potentiel: doublonAvertissement,
      cle_idempotence: cleIdempotence,
      sync_status: 'DRAFT' as const,
      date_maj: new Date().toISOString(),
    };

    try {
      await clientRepository.create(nouveauClient);
      setClientACréer(nouveauClient);
      setDialogVisible(true);
      setNom('');
      setPrenom('');
      setTelephone('');
      await chargerClients();
    } catch (e) {
      // Erreur d'insertion
    }
  }

  function confirmerCreation() {
    setDialogVisible(false);
    setClientACréer(null);
  }

  function annulerCreation() {
    setDialogVisible(false);
    setClientACréer(null);
  }

  const statutPillKind = (s: string) =>
    s === 'CONFIRME' ? ('success' as const) : ('warning' as const);

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>COOPECA · CLIENTS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Clients
          </Text>
          <Text style={styles.subtitle}>
            Consulter et créer des clients (agence : {agenceId})
          </Text>
        </View>

        {chargement ? (
          <View style={styles.chargement}>
            <Text style={styles.texteChargement}>Chargement…</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Créer un client</Text>
          <InputTexte
            label="Nom"
            value={nom}
            onChangeText={setNom}
            placeholder="Ex. Dupont"
            required
          />
          <InputTexte
            label="Prénom"
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Ex. Jean"
            required
          />
          <InputTexte
            label="Téléphone"
            value={telephone}
            onChangeText={setTelephone}
            placeholder="Ex. +23566123456"
            keyboardType="phone-pad"
            required
            onBlur={verifierDoublons}
          />
          <SelecteurSimple
            label="Statut"
            value={statut === 'CONFIRME' ? 'CONFIRME' : null}
            options={[
              { label: 'Confirmé', value: 'CONFIRME' },
              { label: 'Provisoire', value: 'PROVISOIRE' },
            ]}
            onValueChange={(v) => setStatut(v as any)}
            accessibilityLabel="Statut du client"
          />
          {doublonAvertissement && (
            <AppNotice
              title="Doublon potentiel détecté"
              body={
                "Ce client pourrait déjà exister dans cette agence. Une revue par un superviseur habilité est requise avant toute fusion. Aucune fusion automatique n'est effectuée."
              }
              kind="warning"
            />
          )}
          <Pressable
            style={styles.boutonCreer}
            onPress={creerClient}
            disabled={!nom || !prenom || !telephone}
          >
            <Text style={styles.texteBoutonCreer}>
              Créer le client (statut : {statut})
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Clients de l'agence ({clients.length})
          </Text>
          {clients.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>
                Aucun client pour le moment. Créez-en un ci-dessus.
              </Text>
            </View>
          ) : (
            clients.map((c) => (
              <View key={c.id} style={styles.ligneClient}>
                <View style={styles.infosClient}>
                  <Text style={styles.nomClient}>{c.prenom} {c.nom}</Text>
                  <Text style={styles.telClient}>
                    {c.telephone_normalise}
                  </Text>
                </View>
                <View style={styles.badgesClient}>
                  <StatusPill
                    kind={statutPillKind(c.statut)}
                    label={c.statut}
                  />
                  <StatusPill
                    kind={
                      c.sync_status === 'SYNCED'
                        ? ('success' as const)
                        : ('pending' as const)
                    }
                    label={c.sync_status}
                  />
                  {c.doublon_potentiel ? (
                    <StatusPill kind="warning" label="Doublon" />
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.noteBas}>
          <Text style={styles.texteNote}>
            Les clients créés hors ligne ont le statut PROVISOIRE. Ils seront
            confirmés par le serveur lors de la prochaine synchronisation.
          </Text>
        </View>
      </ScrollView>

      <DialogConfirmation
        visible={dialogVisible}
        title="Client créé"
        message={
          clientACréer
            ? `Le client ${clientACréer.prenom} ${clientACréer.nom} a été enregistré localement (${clientACréer.statut}).`
            : ''
        }
        confirmLabel="OK"
        cancelLabel=""
        onConfirm={confirmerCreation}
        onCancel={annulerCreation}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    gap: 8,
    paddingTop: 4,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  boutonCreer: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  texteBoutonCreer: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  ligneClient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  infosClient: {
    flex: 1,
    gap: 2,
  },
  nomClient: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  telClient: {
    color: colors.muted,
    fontSize: 13,
  },
  badgesClient: {
    flexDirection: 'row',
    gap: 6,
  },
  vide: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
  },
  texteVide: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  chargement: {
    padding: 24,
    alignItems: 'center',
  },
  texteChargement: {
    color: colors.muted,
    fontSize: 14,
  },
  noteBas: {
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
  },
  texteNote: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 18,
  },
});