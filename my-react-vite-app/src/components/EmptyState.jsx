function EmptyState({ icon = '🎬', title, message, action }) {
  return (
    <div className="fade-in-up mx-auto my-4 max-w-[600px] rounded-xl bg-panel p-8 text-center sm:p-12">
      <div className="float-icon mb-3 inline-block text-4xl" aria-hidden="true">
        {icon}
      </div>
      <p className="mb-2 text-lg font-semibold text-ink">{title}</p>
      {message && <p className="leading-relaxed text-ink-muted">{message}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
