import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker
    .register('/sw.js', { scope: '/', updateViaCache: 'none' })
    .catch(error => console.error('Service worker registration failed', error))
}

export default app
