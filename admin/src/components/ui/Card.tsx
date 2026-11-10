// ============================================================================
// Design System COOPECA — Carte unifiée (Web Admin)
// Source : docs/uiux/Design_System.md §7
// ============================================================================

import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`card ${className}`}>{children}</div>;
}