import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

// US-103: 初回表示前に theme を適用（FOUC 防止）
const stored = localStorage.getItem('webhook-analyzer-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = stored === 'dark' || stored === 'light' ? stored === 'dark' : prefersDark
document.documentElement.classList.toggle('dark', isDark)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
