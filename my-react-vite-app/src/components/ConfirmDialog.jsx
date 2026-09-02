import '../css/ConfirmDialog.css';

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title">{title}</h3>
        {message && <p>{message}</p>}
        <div className="confirm-actions">
          <button type="button" onClick={onCancel} className="confirm-cancel">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="confirm-accept">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
