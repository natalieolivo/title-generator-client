import "@testing-library/jest-dom";

// The route tests run in the node environment, where window is undefined.
if (typeof window !== "undefined") {
  const { getComputedStyle } = window;
  window.getComputedStyle = (elt) => getComputedStyle(elt);
  window.HTMLElement.prototype.scrollIntoView = () => {};

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  if (!document.fonts) {
    Object.defineProperty(document, "fonts", {
      value: { ready: Promise.resolve(), addEventListener: () => {}, removeEventListener: () => {} },
    });
  }

  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
}
