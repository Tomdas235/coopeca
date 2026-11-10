// ============================================================================
// Design System COOPECA — Badge de statut (Web Admin)
// Source : docs/uiux/Design_System.md §8
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  kind?: 'confirme' | 'provisoire' | 'en_attente' | 'conflit' | 'erreur' | 'non_mesure';
  className?: string;
}

export function Badge({
  children,
  kind = 'non_mesure',
  className = '',
}: BadgeProps) {
  return (
    <span className={`badge badge-${kind} ${className}`}>{children}</span>
  );
}