import { useEffect } from 'react'
import './Modal.css'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isConfirming, isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div
        className="admin-modal-panel"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <p className="admin-modal-description">{message}</p>
        </div>

        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-cancel" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button type="button" className="admin-modal-danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Removing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
