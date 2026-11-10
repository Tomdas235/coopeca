// ============================================================================
// Design System COOPECA — Champ de saisie unifié (Web Admin)
// Source : docs/uiux/Design_System.md §6
// Règles : libellé visible, indication d'erreur, bordure rouge en cas d'erreur,
// message d'erreur sous le champ, préservation de la saisie.
// ============================================================================

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
  type?: string;
  accessibilityLabel?: string;
  onBlur?: () => void;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  error: errorProp,
  required = false,
  maxLength,
  disabled = false,
  type = 'text',
  accessibilityLabel,
  onBlur,
}: InputProps) {
  const estVide = value.trim() === '';
  const depasseLongueur = maxLength !== undefined && value.length > maxLength;

  let erreurCalculee: string | null = null;

  if (required && estVide) {
    erreurCalculee = 'Ce champ est requis.';
  } else if (depasseLongueur && maxLength !== undefined) {
    erreurCalculee = `Maximum ${maxLength} caractères.`;
  }

  const estValide = erreurCalculee === null;
  const erreurAffichee = errorProp ?? erreurCalculee;
  const compteur = maxLength !== undefined ? `${value.length}/${maxLength}` : undefined;

  return (
    <div className="input-field">
      <div className="input-label-row">
        <label className="input-label" htmlFor={accessibilityLabel ?? label}>
          {label}
        </label>
        {required ? <span className="input-required">*</span> : null}
        {compteur ? <span className="input-counter">{compteur}</span> : null}
      </div>
      <input
        className={`input ${!estValide ? 'input-error' : ''}`}
        id={accessibilityLabel ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        maxLength={maxLength}
        aria-label={accessibilityLabel ?? label}
        aria-invalid={!estValide || undefined}
        aria-required={required}
      />
      {!estValide && erreurAffichee ? (
        <span className="input-error-text">{erreurAffichee}</span>
      ) : null}
    </div>
  );
}