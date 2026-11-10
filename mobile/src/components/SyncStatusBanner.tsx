import { StyleSheet, Text, View } from 'react-native';
import { StatusPill, type StatusKind } from './StatusPill';
import { colors } from './theme';

export type SyncDisplayState = 'unknown' | StatusKind;

/**
 * Bannière d'état réseau / synchronisation (Lot 1, fondation visuelle).
 *
 * Contrainte COOPECA : n'afficher que les informations réellement
 * disponibles. Aucune mesure réseau n'existe à ce stade, donc l'état
 * par défaut est `unknown` avec un libellé honnête. Les futurs lots
 * brancheront ici la vraie source (file locale, état réseau).
 */
interface SyncStatusBannerProps {
  state?: SyncDisplayState;
  pendingCount?: number;
}

const libelles: Record<SyncDisplayState, { titre: string; detail: string }> = {
  unknown: {
    titre: 'Vérification réseau',
    detail: 'Vérification de la connexion au serveur COOPECA en cours…',
  },
  online: {
    titre: 'Connecté au serveur COOPECA',
    detail: 'Le serveur est accessible. Les opérations financières sont validées en ligne.',
  },
  offline: {
    titre: 'Mode hors ligne',
    detail: 'Aucune connexion active. Les opérations locales sont conservées pour synchronisation ultérieure.',
  },
  pending: {
    titre: 'Synchronisation en attente',
    detail: 'Des opérations locales sont en cours de transmission vers le serveur.',
  },
  error: {
    titre: 'Erreur réseau',
    detail: 'Impossible de joindre le serveur. Vérifiez votre connexion Internet.',
  },
};

export function SyncStatusBanner({ state = 'unknown', pendingCount = 0 }: SyncStatusBannerProps) {
  const { titre, detail } = libelles[state];
  const pillKind = state === 'unknown' ? 'unknown' : state;
  const pillLabel =
    state === 'unknown' ? 'NON MESURÉ' : state === 'pending' && pendingCount > 0 ? `${pendingCount} EN ATTENTE` : titre;

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>{titre}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <StatusPill kind={pillKind} label={pillLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
