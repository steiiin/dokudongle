import Components from 'unplugin-vue-components/vite'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { defineConfig, type Plugin } from 'vitest/config'

const VIRTUAL_DICTIONARY_DE = 'virtual:dictionary-de'
const RESOLVED_VIRTUAL_DICTIONARY_DE = `\0${VIRTUAL_DICTIONARY_DE}`

const dictionaryDeBrowserPlugin = (): Plugin => ({
  name: 'dictionary-de-browser',
  resolveId(id: string) {
    return id === VIRTUAL_DICTIONARY_DE ? RESOLVED_VIRTUAL_DICTIONARY_DE : null
  },
  async load(id: string) {
    if (id !== RESOLVED_VIRTUAL_DICTIONARY_DE) return null

    const entryUrl = import.meta.resolve('dictionary-de')
    const packageDirectory = new URL('.', entryUrl)
    const dictionaryPath = fileURLToPath(new URL('./src/assets/dictionaries/de.dic', import.meta.url))
    this.addWatchFile(dictionaryPath)
    const [aff, source] = await Promise.all([
      readFile(fileURLToPath(new URL('index.aff', packageDirectory)), 'utf8'),
      readFile(dictionaryPath, 'utf8'),
    ])
    // Keep the editable file in Hunspell format, but update its entry count in
    // memory so adding/removing words never requires maintaining the header.
    const [, ...lines] = source.split(/\r?\n/)
    const count = lines.filter(line => line.length > 0 && !/^\s/.test(line)).length
    const dic = [String(count), ...lines].join('\n')

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
