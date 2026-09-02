import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

function NotFound() {
  return (
    <div style={{ padding: '2rem' }}>
      <EmptyState
        icon="🧭"
        title="Page not found"
        message="The page you're looking for doesn't exist."
        action={
          <Link to="/" className="state-action">
            Back to Home
          </Link>
        }
      />
    </div>
  );
}

export default NotFound;
