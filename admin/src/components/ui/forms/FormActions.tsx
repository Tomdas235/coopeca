// FormActions — barre d'actions (Annuler / Enregistrer) (Admin Web)
interface FormActionButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
}

interface FormActionsProps {
  cancelLabel?: string
  onCancel: () => void
  submitLabel: string
  onSubmit: () => void
  cancelVariant?: 'secondary' | 'ghost'
  submitVariant?: 'primary' | 'danger'
  className?: string
}

export function FormActionButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
}: FormActionButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${disabled ? 'btn-disabled' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className="btn-loading">Chargement…</span> : label}
    </button>
  );
}

export function FormActions({
  cancelLabel = 'Annuler',
  onCancel,
  submitLabel = 'Enregistrer',
  onSubmit,
  cancelVariant = 'secondary',
  submitVariant = 'primary',
  className = '',
}: FormActionsProps) {
  return (
    <div className={`form-actions ${className}`}>
      <button type="button" className={`btn btn-${cancelVariant}`} onClick={onCancel}>
        {cancelLabel}
      </button>
      <button type="submit" className={`btn btn-${submitVariant}`} onClick={onSubmit}>
        {submitLabel}
      </button>
    </div>
  );
}
