import { mount } from 'svelte'

import App from './App.svelte'

import { loadConfig } from '$lib/config'

import './app.css'

async function bootstrap() {
  await loadConfig()
  mount(App, { target: document.getElementById('app')! })
}

bootstrap()
