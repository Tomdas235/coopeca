// Textarea — zone de texte multiligne (Admin Web)

interface TextareaProps {
  label: string
  required?: boolean
  error?: string | null
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  className?: string
}

export function Textarea({
  label,
  required = false,
  error,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  className = '',
}: TextareaProps) {
  const compteur = maxLength !== undefined ? `${value.length}/${maxLength}` : null

  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required ? <span className="form-field-required" aria-hidden="true">*</span> : null}
      </label>
      <textarea
        className={`form-textarea ${error ? 'form-textarea-error' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        maxLength={maxLength}
      />
      {compteur ? (
        <p className="form-field-counter">{compteur}</p>
      ) : null}
      {error ? (
        <p className="form-field-error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
