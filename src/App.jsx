import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import CreateGrooming from './pages/CreateGrooming'
import GroomingBoard from './pages/GroomingBoard'

// Wrapper for redirecting old URLs
function RoomRedirect() {
  const { id } = useParams();
  return <Navigate to={`/grooming/${id}`} replace />;
}

function App() {
  return (
    <div className="min-h-screen app-container px-4">
      <Routes>
        <Route path="/" element={<CreateGrooming />} />
        <Route path="/grooming/:id" element={<GroomingBoard />} />
        <Route path="/room/:id" element={<RoomRedirect />} />
      </Routes>
    </div>
  )
}

export default App
