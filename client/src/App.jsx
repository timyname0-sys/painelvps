import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FileManager from './pages/FileManager'
import Domains from './pages/Domains'
import StaticSites from './pages/StaticSites'
import Apps from './pages/Apps'
import DockerManager from './pages/DockerManager'
import Settings from './pages/Settings'

function ProtectedLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-dark-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <ProtectedLayout>{children}</ProtectedLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/files" element={<PrivateRoute><FileManager /></PrivateRoute>} />
        <Route path="/files/*" element={<PrivateRoute><FileManager /></PrivateRoute>} />
        <Route path="/domains" element={<PrivateRoute><Domains /></PrivateRoute>} />
        <Route path="/sites" element={<PrivateRoute><StaticSites /></PrivateRoute>} />
        <Route path="/apps" element={<PrivateRoute><Apps /></PrivateRoute>} />
        <Route path="/docker" element={<PrivateRoute><DockerManager /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
