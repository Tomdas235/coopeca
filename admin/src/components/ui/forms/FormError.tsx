// FormError — message d'erreur de formulaire (Admin Web)
interface FormErrorProps {
  message: string
  className?: string
}

export function FormError({ message, className = '' }: FormErrorProps) {
  return (
    <div className={`form-error ${className}`} role="alert">
      {message}
    </div>
  );
}
