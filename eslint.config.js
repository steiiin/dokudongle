import js from '@eslint/js'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default withVueTs(
  {
    ignores: [
      '**/android/**',
      '**/coverage/**',
      '**/dist/**',
      '**/ios/**',
      '**/node_modules/**',
      '**/tests/e2e/screenshots/**',
      '**/tests/e2e/videos/**',
      '**/components.d.ts',
    ],
  },
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    files: ['src/**/*.{ts,tsx,vue}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.{js,mjs,ts}', 'eslint.config.js', 'vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['tests/e2e/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        Cypress: 'readonly',
        cy: 'readonly',
      },
    },
  },
  {
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/no-mutating-props': ['error', { shallowOnly: true }],
      'vue/no-deprecated-slot-attribute': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
