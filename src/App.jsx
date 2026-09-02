import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import BottomTabBar from './components/BottomTabBar'
import Footer from './components/Footer'
import OnlineStatusBanner from './components/OnlineStatusBanner'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import { initOfflineQueue } from './lib/offlineQueue'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RepairList from './pages/RepairList'
import RepairForm from './pages/RepairForm'
import RepairDetailGate from './pages/RepairDetailGate'
import RepairEdit from './pages/RepairEdit'
import RepairPrint from './pages/RepairPrint'
import RepairPrintBlank from './pages/RepairPrintBlank'
import RepairReport from './pages/RepairReport'
import RepairAssess from './pages/RepairAssess'
import RepairStatus from './pages/RepairStatus'
import RepairClose from './pages/RepairClose'
import Scan from './pages/Scan'
import PublicScan from './pages/PublicScan'
import TechnicianList from './pages/TechnicianList'

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
        {/* กันเนื้อหาโดน BottomTabBar.jsx (ตรึงล่างจอ เฉพาะจอมือถือ) บังตอนเลื่อนสุดหน้า —
            รวม safe-area-inset-bottom ด้วยเผื่อมือถือมี home indicator/gesture bar ทับพื้นที่ล่าง */}
        <div className="min-h-screen bg-[#fffaf5] flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
          <PwaUpdatePrompt />
          <OnlineStatusBanner />
          <Navbar />
          <div className="flex-1">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/staff/login" element={<Login />} />
                <Route path="/scan-status" element={<PublicScan />} />
                <Route path="/repairs" element={withPrivate(<RepairList />)} />
                <Route path="/repairs/new" element={withPrivate(<RepairForm />)} />
                <Route path="/repairs/:id" element={<RepairDetailGate />} />
                <Route path="/repairs/:id/edit" element={withPrivate(<RepairEdit />)} />
                <Route path="/repairs/:id/print" element={withPrivate(<RepairPrint />)} />
                <Route path="/print-blank" element={withPrivate(<RepairPrintBlank />)} />
                <Route path="/repairs/:id/report" element={withPrivate(<RepairReport />)} />
                <Route path="/repairs/:id/assess" element={withPrivate(<RepairAssess />)} />
                <Route path="/repairs/:id/status" element={withPrivate(<RepairStatus />)} />
                <Route path="/repairs/:id/close" element={withPrivate(<RepairClose />)} />
                <Route path="/scan" element={withPrivate(<Scan />)} />
                <Route path="/technicians" element={withPrivate(<TechnicianList />)} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
          <Footer />
          <BottomTabBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
