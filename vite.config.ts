/// <reference types="vitest" />

import Components from 'unplugin-vue-components/vite'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { defineConfig } from 'vite'

const VIRTUAL_DICTIONARY_DE = 'virtual:dictionary-de'
const RESOLVED_VIRTUAL_DICTIONARY_DE = `\0${VIRTUAL_DICTIONARY_DE}`

const dictionaryDeBrowserPlugin = () => ({
  name: 'dictionary-de-browser',
  resolveId(id: string) {
    return id === VIRTUAL_DICTIONARY_DE ? RESOLVED_VIRTUAL_DICTIONARY_DE : null
  },
  async load(id: string) {
    if (id !== RESOLVED_VIRTUAL_DICTIONARY_DE) return null

    const entryUrl = import.meta.resolve('dictionary-de')
    const packageDirectory = new URL('.', entryUrl)
    const [aff, dic] = await Promise.all([
      readFile(fileURLToPath(new URL('index.aff', packageDirectory)), 'utf8'),
      readFile(fileURLToPath(new URL('index.dic', packageDirectory)), 'utf8'),
    ])

    return `export default ${JSON.stringify({ aff, dic })}`
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dictionaryDeBrowserPlugin(),
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
  worker: {
    format: 'es',
    plugins: () => [dictionaryDeBrowserPlugin()],
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
