import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JobsList from './pages/JobsList'
import JobDetail from './pages/JobDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
