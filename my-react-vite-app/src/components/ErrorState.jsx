import Button from './Button';

function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="fade-in-up mx-auto my-4 max-w-[600px] rounded-xl bg-panel p-8 text-center sm:p-12" role="alert">
      <p className="mb-2 text-lg font-semibold text-bad">⚠ {message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
