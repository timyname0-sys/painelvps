import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Globe,
  FileCode,
  AppWindow,
  Container,
  Settings,
  X,
  Zap
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/files', icon: FolderOpen, label: 'File Manager' },
  { path: '/domains', icon: Globe, label: 'Domínios' },
  { path: '/sites', icon: FileCode, label: 'Sites Estáticos' },
  { path: '/apps', icon: AppWindow, label: 'Aplicativos' },
  { path: '/docker', icon: Container, label: 'Docker' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              udiaas
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400 border border-indigo-500/20'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-dark-500 group-hover:text-dark-300'}`} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700/50">
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-dark-500">Painel udiaas v1.0</p>
            <p className="text-xs text-dark-600 mt-1">Feito com 💜</p>
          </div>
        </div>
      </aside>
    </>
  )
}
