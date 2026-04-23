import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition wraps page content with a subtle fade-in on route changes.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  return (
    <div
      className="transition-all duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)' }}
    >
      {children}
    </div>
  );
}