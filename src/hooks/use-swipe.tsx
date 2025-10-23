import { useEffect, useRef, useState, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeMove?: (offset: number) => void;
}

interface SwipeState {
  offset: number;
  isSwiping: boolean;
}

export function useSwipe(handlers: SwipeHandlers): SwipeState {
  const touchStartX = useRef<number>(0);
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // Apply rubber band effect at edges (max swipe distance)
    const maxDistance = 300;
    const rubberBandOffset = Math.sign(diff) * Math.min(Math.abs(diff), maxDistance);
    
    setOffset(rubberBandOffset);
    handlers.onSwipeMove?.(rubberBandOffset);
  }, [isSwiping, handlers]);

  const handleTouchEnd = useCallback(() => {
    const distance = -offset; // Negative because we track finger movement
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        handlers.onSwipeLeft?.();
      } else {
        handlers.onSwipeRight?.();
      }
    }
    
    setOffset(0);
    setIsSwiping(false);
  }, [offset, handlers, minSwipeDistance]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { offset, isSwiping };
}
