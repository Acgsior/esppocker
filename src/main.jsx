import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { GroomingProvider } from './context/GroomingContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <GroomingProvider>
          <App />
        </GroomingProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
