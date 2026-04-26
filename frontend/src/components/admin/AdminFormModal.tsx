import { useEffect, type FormEvent, type ReactNode } from 'react'
import './Modal.css'

interface AdminFormModalProps {
  isOpen: boolean
  title: string
  description?: string
  submitLabel: string
  cancelLabel?: string
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

export default function AdminFormModal({
  isOpen,
  title,
  description,
  submitLabel,
  cancelLabel = 'Cancel',
  isSubmitting = false,
  onClose,
  onSubmit,
  children,
}: AdminFormModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          {description && <p className="admin-modal-description">{description}</p>}
        </div>

        <form onSubmit={onSubmit}>
          <div className="admin-modal-body">{children}</div>
          <div className="admin-modal-actions">
            <button type="button" className="admin-modal-cancel" onClick={onClose} disabled={isSubmitting}>
              {cancelLabel}
            </button>
            <button type="submit" className="admin-modal-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
