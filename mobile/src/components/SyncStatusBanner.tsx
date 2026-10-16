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
    titre: 'État réseau non mesuré',
    detail:
      'Version de démonstration : la connexion et la synchronisation réelles ne sont pas configurées. Aucune opération n’est envoyée.',
  },
  online: {
    titre: 'En ligne (exemple)',
    detail: 'Exemple visuel uniquement — non mesuré dans cette version.',
  },
  offline: {
    titre: 'Hors ligne (exemple)',
    detail: 'Exemple visuel uniquement — non mesuré dans cette version.',
  },
  pending: {
    titre: 'Synchronisation en attente (exemple)',
    detail: 'Exemple visuel uniquement — aucune file réelle dans cette version.',
  },
  error: {
    titre: 'Erreur (exemple)',
    detail: 'Exemple visuel uniquement — aucune erreur réelle dans cette version.',
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
