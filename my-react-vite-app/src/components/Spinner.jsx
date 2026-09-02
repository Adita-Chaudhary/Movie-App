import '../css/States.css';

function Spinner({ label = 'Loading…' }) {
  return (
    <div role="status" aria-label={label}>
      <div className="spinner" />
    </div>
  );
}

export default Spinner;
