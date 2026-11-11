// Select — liste déroulante stylisée (Admin Web)

interface SelectProps {
  label?: string
  required?: boolean
  error?: string | null
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  className?: string
}

export function Select({
  label,
  required = false,
  error,
  value,
  onChange,
  options,
  placeholder = '— Sélectionner —',
  className = '',
}: SelectProps) {
  return (
    <div className={`form-field ${className}`}>
      {label ? (
        <label className="form-field-label">
          {label}
          {required ? <span className="form-field-required" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      <select
        className={`form-select ${error ? 'form-select-error' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="form-field-error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
