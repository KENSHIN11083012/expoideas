import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.vite']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Sin esta regla, no-unused-vars no ve las variables usadas solo en JSX.
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', {
        // Solo se ignoran las variables marcadas a propósito con _.
        varsIgnorePattern: '^_',
        // Permite el idioma `const { campo, ...resto } = obj` para omitir campos.
        ignoreRestSiblings: true,
        // Un catch puede no necesitar el error.
        caughtErrors: 'none',
      }],
    },
  },
  {
    // Los archivos de configuración corren en Node, no en el navegador.
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
])
