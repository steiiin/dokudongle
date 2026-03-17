/// <reference types="vitest" />

import Components from 'unplugin-vue-components/vite'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy(),
    Components({
      resolvers: [
        (name) => {
          if (name.startsWith('Ion')) {
            return { name, from: '@ionic/vue' }
          }
          if (name.startsWith('Dodo')) {
            return { name, from: './src/components'}
          }
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})