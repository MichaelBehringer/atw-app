import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  reactRefresh.configs.vite,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2025 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    // eslint-plugin-react-hooks 7 bringt set-state-in-effect neu mit. Die Regel
    // trifft vier gewachsene Stellen (MySider, Planner, Search), deren Umbau
    // Komponentenlogik aendern wuerde - das ist bewusst nicht Teil des
    // Versions-Upgrades. Als Warnung bleibt die Altlast sichtbar.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
]
