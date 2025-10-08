// src/utils/reactSwipeable.js
// Minimal hook that mimics the `react-swipeable` API used for carousel navigation.

import { useCallback, useMemo, useRef } from "react";

export function useSwipeable({ onSwipedLeft, onSwipedRight, delta = 40, trackMouse = false } = {}) {
  const startXRef = useRef(null);
  const startTimeRef = useRef(0);

  const start = useCallback((clientX) => {
    startXRef.current = clientX;
    startTimeRef.current = Date.now();
  }, []);

  const end = useCallback(
    (clientX) => {
      if (startXRef.current == null) return;
      const diff = clientX - startXRef.current;
      const elapsed = Date.now() - startTimeRef.current;
      startXRef.current = null;

      if (Math.abs(diff) < delta || elapsed > 800) return;
      if (diff < 0) {
        onSwipedLeft?.({ deltaX: diff });
      } else {
        onSwipedRight?.({ deltaX: diff });
      }
    },
    [delta, onSwipedLeft, onSwipedRight]
  );

  const handlers = useMemo(
    () => ({
      onTouchStart: (event) => {
        const touch = event.touches[0];
        if (touch) start(touch.clientX);
      },
      onTouchEnd: (event) => {
        const touch = event.changedTouches[0];
        if (touch) end(touch.clientX);
      },
      onMouseDown: trackMouse
        ? (event) => {
            start(event.clientX);
          }
        : undefined,
      onMouseUp: trackMouse
        ? (event) => {
            end(event.clientX);
          }
        : undefined,
    }),
    [end, start, trackMouse]
  );

  return handlers;
}

export default useSwipeable;
