// Radio — bouton radio groupé (Admin Web)
interface RadioOption {
  value: string
  label: string
}

interface RadioProps {
  label: string
  required?: boolean
  error?: string | null
  name: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  className?: string
}

export function Radio({
  label,
  required = false,
  error,
  name,
  value,
  onChange,
  options,
  className = '',
}: RadioProps) {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required ? <span className="form-field-required" aria-hidden="true">*</span> : null}
      </label>
      <div className="form-field-radio-group">
        {options.map((opt) => (
          <label key={opt.value} className="form-field-radio-label">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              required={required}
            />
            <span className="form-field-radio-text">{opt.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="form-field-error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
