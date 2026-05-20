// pdfjs-dist v5 uses Map.prototype.getOrInsertComputed (TC39 Stage 3, not yet in browsers)
if (!('getOrInsertComputed' in Map.prototype)) {
  Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
    configurable: true,
    writable: true,
    value(key: unknown, fn: (k: unknown) => unknown) {
      if (!this.has(key)) this.set(key, fn(key))
      return this.get(key)
    },
  })
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
