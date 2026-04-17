import baseConfig from '@smart-todo/config/eslint'
import sveltePlugin from 'eslint-plugin-svelte'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  ...sveltePlugin.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },
]
