import { useState, useEffect } from 'react';

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      setIsPWA(isStandalone);
    };
    checkPWA();
    window.addEventListener('resize', checkPWA);
    return () => window.removeEventListener('resize', checkPWA);
  }, []);

  return isPWA;
}
