import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// findBy* wartet von Haus aus nur 1s. Laufen alle Testdateien parallel (und in
// der CI auf schwachen Runnern), braucht antd laenger - der Test schlug dann
// gelegentlich fehl, obwohl die Oberflaeche stimmte.
configure({ asyncUtilTimeout: 5000 })

// jsdom implementiert ResizeObserver nicht. antd nutzt es ueber
// rc-resize-observer in Layout, Menu, Table und Select.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

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
