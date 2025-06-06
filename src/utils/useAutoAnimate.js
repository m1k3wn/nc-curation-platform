import { useRef, useEffect } from 'react';
import autoAnimate from '@formkit/auto-animate';

export function useAutoAnimate(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      autoAnimate(ref.current, {
        duration: 200, 
        easing: 'ease-out',
        ...options
      });
      
    }
  }, []);

  return [ref];
}