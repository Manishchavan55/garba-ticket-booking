import { useEffect, useState } from 'react';

export function useScrollReveal() {
  const [visible, setVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px' }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return [setRef, visible];
}
