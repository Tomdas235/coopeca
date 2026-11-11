// FormSection — section de formulaire avec titre (Admin Web)
interface FormSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <section className={`form-section ${className}`}>
      {title ? (
        <h3 className="form-section-title">{title}</h3>
      ) : null}
      <div className="form-section-body">{children}</div>
    </section>
  );
}
