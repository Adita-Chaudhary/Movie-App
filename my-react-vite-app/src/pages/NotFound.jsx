import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

function NotFound() {
  return (
    <div className="p-8">
      <EmptyState
        icon="🧭"
        title="Page not found"
        message="The page you're looking for doesn't exist."
        action={<Button to="/">Back to Home</Button>}
      />
    </div>
  );
}

export default NotFound;
