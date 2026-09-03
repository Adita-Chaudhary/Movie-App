function Spinner({ label = 'Loading…' }) {
  return (
    <div role="status" aria-label={label}>
      <div className="mx-auto my-12 h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-brand" />
    </div>
  );
}

export default Spinner;
