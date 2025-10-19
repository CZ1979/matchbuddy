import "@testing-library/jest-dom/vitest";

// Mock window.scrollTo für Tests
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
});
