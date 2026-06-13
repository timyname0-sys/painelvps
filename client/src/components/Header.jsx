import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react'
import api from '../lib/api'

export default function Header({ onMenuClick }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchQuickStats()
    const interval = setInterval(fetchQuickStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchQuickStats() {
    try {
      const { data } = await api.get('/dashboard/stats')
      setStats(data)
    } catch (err) {
      console.error('Erro ao buscar stats:', err)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <header className="h-16 bg-dark-900/50 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-dark-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Quick stats */}
        {stats && (
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-dark-400">CPU</span>
              <span className="text-dark-200 font-medium">{stats.cpu?.usage?.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-dark-400">RAM</span>
              <span className="text-dark-200 font-medium">{stats.memory?.usagePercent?.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-dark-400">Uptime</span>
              <span className="text-dark-200 font-medium">{stats.system?.uptime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-800 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-sm text-dark-200">{user.username || 'Admin'}</span>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 glass-card shadow-xl z-50 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-dark-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
