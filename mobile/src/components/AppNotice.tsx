import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export type NoticeKind = 'info' | 'warning' | 'error' | 'success';

/**
 * Bandeau de message COOPECA (Lot 1, fondation visuelle).
 *
 * Utilisé pour les états vides informatifs, les avertissements
 * (ex. démonstration), et les erreurs affichées sans perte de saisie.
 * Aucune logique métier.
 */
interface AppNoticeProps {
  title: string;
  body: string;
  kind?: NoticeKind;
}

const palette: Record<NoticeKind, { background: string; border: string; title: string }> = {
  info: {
    background: colors.accentSoft,
    border: colors.border,
    title: colors.accent,
  },
  warning: {
    background: colors.warningSoft,
    border: colors.warning,
    title: colors.warning,
  },
  error: {
    background: colors.dangerSoft,
    border: colors.danger,
    title: colors.danger,
  },
  success: {
    background: colors.successSoft,
    border: colors.success,
    title: colors.success,
  },
};

export function AppNotice({ title, body, kind = 'info' }: AppNoticeProps) {
  const tone = palette[kind];

  return (
    <View
      accessibilityRole="text"
      style={[styles.notice, { backgroundColor: tone.background, borderColor: tone.border }]}
    >
      <Text style={[styles.title, { color: tone.title }]}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: 5,
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
