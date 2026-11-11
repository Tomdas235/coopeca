// DatePicker — sélecteur de date natif HTML5 (Admin Web)
interface DatePickerProps {
  label: string
  required?: boolean
  error?: string | null
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  className?: string
}

export function DatePicker({
  label,
  required = false,
  error,
  value,
  onChange,
  min,
  max,
  className = '',
}: DatePickerProps) {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required ? <span className="form-field-required" aria-hidden="true">*</span> : null}
      </label>
      <input
        type="date"
        className={`form-datepicker ${error ? 'form-datepicker-error' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min ?? undefined}
        max={max ?? undefined}
      />
      {error ? (
        <p className="form-field-error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
