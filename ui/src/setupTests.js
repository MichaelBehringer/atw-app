import '@testing-library/jest-dom/vitest'

// jsdom implementiert window.matchMedia nicht. antd braucht es fuer die
// responsiven Grid-Komponenten (Row/Col), sonst schlaegt jedes Rendern fehl.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
