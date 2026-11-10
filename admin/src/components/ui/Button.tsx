// ============================================================================
// Design System COOPECA — Bouton unifié (Web Admin)
// Source : docs/uiux/Design_System.md §5
// Règles : hauteur min 44 px, variantes primary/secondary/ghost/danger/loading,
// états pressé/focus/disabled, contraste texte sur fond.
// ============================================================================

import { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const handleClick = isDisabled ? undefined : onClick;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={`btn btn-${variant} btn-${size} ${isDisabled ? 'btn-disabled' : ''} ${className}`}
    >
      {loading ? <span className="btn-loading">Chargement…</span> : children}
    </button>
  );
}