// src/utils/reactHotToast.js
// Lightweight drop-in replacement used to mimic `react-hot-toast` in this environment.

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

let idCounter = 0;
const listeners = new Set();

const emit = (event) => {
  listeners.forEach((listener) => listener(event));
};

const createToast = (message, variant, options = {}) => ({
  id: `toast-${Date.now()}-${idCounter++}`,
  message,
  variant,
  duration: options.duration ?? 3500,
});

const show = (message, variant, options) => {
  const toast = createToast(message, variant, options);
  emit({ type: "add", toast });
  return toast.id;
};

const dismiss = (id) => emit({ type: "remove", id });

const toast = {
  success(message, options) {
    return show(message, "success", options);
  },
  error(message, options) {
    return show(message, "error", options);
  },
  message(message, options) {
    return show(message, "default", options);
  },
  dismiss,
};

const POSITION_MAP = {
  "top-right": "top-4 right-4 items-end",
  "top-center": "top-4 inset-x-0 items-center",
  "bottom-center": "bottom-4 inset-x-0 items-center",
};

const variantClasses = {
  success: "border-success bg-success/10 text-success",
  error: "border-error bg-error/10 text-error",
  default: "border-base-300 bg-base-100 text-base-content",
};

/**
 * Minimal toast container that renders into a portal similar to `react-hot-toast`.
 */
export function Toaster({ position = "top-right" }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      if (event.type === "add") {
        setItems((list) => [...list, event.toast]);
        if (event.toast.duration !== Infinity) {
          window.setTimeout(() => dismiss(event.toast.id), event.toast.duration);
        }
      } else if (event.type === "remove") {
        setItems((list) => list.filter((item) => item.id !== event.id));
      } else if (event.type === "removeAll") {
        setItems([]);
      }
    };

    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const positionClasses = POSITION_MAP[position] ?? POSITION_MAP["top-right"];

  const content = useMemo(
    () =>
      React.createElement(
        "div",
        {
          className: `pointer-events-none fixed z-[9999] flex w-full max-w-md flex-col gap-2 px-4 ${positionClasses}`,
        },
        items.map((item) =>
          React.createElement(
            "div",
            {
              key: item.id,
              className: `pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg transition ${
                variantClasses[item.variant] ?? variantClasses.default
              }`,
            },
            React.createElement(
              "span",
              { className: "text-sm font-medium" },
              item.message
            )
          )
        )
      ),
    [items, positionClasses]
  );

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}

export { toast };
export default toast;
