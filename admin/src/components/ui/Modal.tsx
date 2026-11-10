// ============================================================================
// Design System COOPECA — Modal / panneau de dialogue (Web Admin)
// Source : docs/uiux/Design_System.md §9
// Règles : fond obscurci, panneau centré, bouton de fermeture (X),
// clic hors panneau ferme le modal, contenu scrollable si besoin.
// ============================================================================

import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: ModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div
        className={`modal-panel ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button
              className="modal-close"
              type="button"
              aria-label="Fermer"
              onClick={onClose}
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        ) : null}
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
}
