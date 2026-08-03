import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard } from 'lucide-react';

/**
 * 404 Not Found error page
 */
export default function NotFoundPage() {
  return (
    <div className="error-page">
      <motion.div
        className="error-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="error-code"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          404
        </motion.h1>

        <h2 className="error-title">Page not found</h2>
        <p className="error-description">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="error-actions">
          <Link to="/" className="btn btn-secondary btn-lg">
            <Home size={18} />
            Go Home
          </Link>
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            <LayoutDashboard size={18} />
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
