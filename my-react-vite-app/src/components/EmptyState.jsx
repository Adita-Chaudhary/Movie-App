import '../css/States.css';

function EmptyState({ icon = '🎬', title, message, action }) {
  return (
    <div className="state-block state-empty">
      <div className="state-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="state-title">{title}</p>
      {message && <p className="state-message">{message}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
