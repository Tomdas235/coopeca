// FormSuccess — message de confirmation de succès (Admin Web)
interface FormSuccessProps {
  message: string
  className?: string
}

export function FormSuccess({ message, className = '' }: FormSuccessProps) {
  return (
    <div className={`form-success ${className}`} role="status">
      {message}
    </div>
  );
}
