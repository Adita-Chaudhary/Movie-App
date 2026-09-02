import '../css/States.css';

function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-block state-error" role="alert">
      <p className="state-title">⚠ {message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="state-action">
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
