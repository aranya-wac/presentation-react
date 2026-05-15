import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { applyInitialTheme } from './hooks/useThemeMode'

// Set data-theme="dark|light" BEFORE React mounts so the first paint matches
// the stored preference (no light→dark flash).
applyInitialTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
