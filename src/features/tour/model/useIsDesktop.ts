import { useEffect, useState } from 'react';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(min-width: 769px)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isDesktop;
}
