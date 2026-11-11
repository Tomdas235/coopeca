// FormField — composant de base label + champ + message d'erreur (Admin Web)
import { type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string | null
  helper?: string
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  required = false,
  error,
  helper,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required ? <span className="form-field-required" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="form-field-error" role="alert">{error}</p>
      ) : helper ? (
        <p className="form-field-helper">{helper}</p>
      ) : null}
    </div>
  );
}
