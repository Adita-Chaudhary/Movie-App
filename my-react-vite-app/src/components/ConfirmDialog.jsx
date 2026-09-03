import Button from './Button';

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <div
      className="fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="scale-in max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-[10px] bg-panel-raised p-6 shadow-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="mb-2 text-lg font-semibold">
          {title}
        </h3>
        {message && <p className="mb-5 text-ink-muted">{message}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="danger" className="border-line text-ink hover:bg-panel" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
