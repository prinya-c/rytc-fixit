import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import OnlineStatusBanner from './components/OnlineStatusBanner'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import { initOfflineQueue } from './lib/offlineQueue'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RepairList from './pages/RepairList'
import RepairForm from './pages/RepairForm'
import RepairDetail from './pages/RepairDetail'
import RepairEdit from './pages/RepairEdit'
import RepairPrint from './pages/RepairPrint'
import RepairReport from './pages/RepairReport'
import RepairAssess from './pages/RepairAssess'
import RepairStatus from './pages/RepairStatus'
import RepairClose from './pages/RepairClose'
import Scan from './pages/Scan'

function withPrivate(element) {
  return <PrivateRoute>{element}</PrivateRoute>
}

export default function App() {
  useEffect(() => {
    initOfflineQueue()
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#fffaf5] flex flex-col">
          <PwaUpdatePrompt />
          <OnlineStatusBanner />
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/staff/login" element={<Login />} />
              <Route path="/repairs" element={withPrivate(<RepairList />)} />
              <Route path="/repairs/new" element={withPrivate(<RepairForm />)} />
              <Route path="/repairs/:id" element={withPrivate(<RepairDetail />)} />
              <Route path="/repairs/:id/edit" element={withPrivate(<RepairEdit />)} />
              <Route path="/repairs/:id/print" element={withPrivate(<RepairPrint />)} />
              <Route path="/repairs/:id/report" element={withPrivate(<RepairReport />)} />
              <Route path="/repairs/:id/assess" element={withPrivate(<RepairAssess />)} />
              <Route path="/repairs/:id/status" element={withPrivate(<RepairStatus />)} />
              <Route path="/repairs/:id/close" element={withPrivate(<RepairClose />)} />
              <Route path="/scan" element={withPrivate(<Scan />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
