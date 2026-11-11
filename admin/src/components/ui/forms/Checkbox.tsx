// Checkbox — case à cocher (Admin Web)
interface CheckboxProps {
  label: string
  required?: boolean
  error?: string | null
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function Checkbox({
  label,
  required = false,
  error,
  checked,
  onChange,
  className = '',
}: CheckboxProps) {
  return (
    <div className={`form-field form-field-checkbox ${className}`}>
      <label className="form-field-checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required={required}
        />
        <span className="form-field-checkbox-text">{label}</span>
      </label>
      {error ? (
        <p className="form-field-error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
