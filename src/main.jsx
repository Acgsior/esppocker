import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { RoomProvider } from './context/RoomContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <RoomProvider>
        <App />
      </RoomProvider>
    </HashRouter>
  </StrictMode>,
)
