import { Routes, Route } from 'react-router-dom'
import CreateRoom from './components/CreateRoom'
import PokerBoard from './components/PokerBoard'

function App() {
  return (
    <div className="min-h-screen app-container px-4">
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/room/:id" element={<PokerBoard />} />
      </Routes>
    </div>
  )
}

export default App
