import { useState, useEffect } from 'react'
import {
  AppWindow, Plus, Trash2, Play, Square, RefreshCw,
  X, Loader2, ExternalLink, Download, Search, Rocket
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function Apps() {
  const [catalog, setCatalog] = useState([])
  const [installed, setInstalled] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('catalog')
  const [searchTerm, setSearchTerm] = useState('')
  const [installing, setInstalling] = useState(null)
  const [showInstall, setShowInstall] = useState(null)
  const [customPort, setCustomPort] = useState('')
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [catRes, instRes] = await Promise.all([
        api.get('/apps/catalog'),
        api.get('/apps/installed')
      ])
      setCatalog(catRes.data.apps || [])
      setInstalled(instRes.data.apps || [])
    } catch (err) {
      toast.error('Erro ao carregar apps')
    } finally {
      setLoading(false)
    }
  }

  async function handleInstall(app) {
    setInstalling(app.id)
    try {
      await api.post('/apps/install', {
        appId: app.id,
        port: customPort ? parseInt(customPort) : app.defaultPort,
        name: customName || app.name
      })
      toast.success(`${app.name} instalado com sucesso!`)
      setShowInstall(null)
      setCustomPort('')
      setCustomName('')
      fetchAll()
      setActiveTab('installed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao instalar')
    } finally {
      setInstalling(null)
    }
  }

  async function handleAction(id, action) {
    try {
      await api.post(`/apps/${id}/${action}`)
      toast.success(action === 'start' ? 'App iniciado!' : 'App parado!')
      fetchAll()
    } catch (err) {
      toast.error(`Erro ao ${action === 'start' ? 'iniciar' : 'parar'} app`)
    }
  }

  async function handleUninstall(id, name) {
    if (!confirm(`Remover "${name}"? Todos os dados serão perdidos.`)) return
    try {
      await api.delete(`/apps/${id}`)
      toast.success('App removido!')
      fetchAll()
    } catch (err) {
      toast.error('Erro ao remover app')
    }
  }

  const filteredCatalog = catalog.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = [...new Set(catalog.map(a => a.category))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Aplicativos</h1>
          <p className="text-dark-400 mt-1">Instale e gerencie apps com Docker</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-800/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          Catálogo ({catalog.length})
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'installed'
              ? 'bg-indigo-600 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          Instalados ({installed.length})
        </button>
      </div>

      {/* Install Modal */}
      {showInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{showInstall.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-dark-200">Instalar {showInstall.name}</h2>
                  <p className="text-xs text-dark-500">{showInstall.description}</p>
                </div>
              </div>
              <button onClick={() => setShowInstall(null)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Nome (opcional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input-field"
                  placeholder={showInstall.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Porta</label>
                <input
                  type="number"
                  value={customPort}
                  onChange={(e) => setCustomPort(e.target.value)}
                  className="input-field"
                  placeholder={showInstall.defaultPort}
                />
                <p className="text-xs text-dark-500 mt-1">Padrão: {showInstall.defaultPort}</p>
              </div>
              <div className="bg-dark-900/50 rounded-lg p-3">
                <p className="text-xs text-dark-400">
                  <strong className="text-dark-300">Docker Image:</strong> {showInstall.dockerImage}
                </p>
                <p className="text-xs text-dark-500 mt-1">
                  <strong className="text-dark-400">Categoria:</strong> {showInstall.category}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowInstall(null)} className="btn-secondary">Cancelar</button>
                <button
                  onClick={() => handleInstall(showInstall)}
                  disabled={installing === showInstall.id}
                  className="btn-primary flex items-center gap-2"
                >
                  {installing === showInstall.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  Instalar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            categories.map((cat) => {
              const catApps = filteredCatalog.filter(a => a.category === cat)
              if (catApps.length === 0) return null

              return (
                <div key={cat}>
                  <h2 className="text-lg font-semibold text-dark-200 mb-3">{cat}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {catApps.map((app) => {
                      const isInstalled = installed.some(i => i.app_id === app.id)
                      return (
                        <div key={app.id} className="glass-card p-5 hover:border-dark-600/50 transition-all group">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-3xl">{app.icon}</span>
                            {isInstalled && (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                Instalado
                              </span>
                            )}
                          </div>
                          <h3 className="text-dark-200 font-semibold">{app.name}</h3>
                          <p className="text-dark-500 text-sm mt-1 line-clamp-2">{app.description}</p>
                          <p className="text-xs text-dark-600 mt-2">
                            Porta: {app.defaultPort} • {app.dockerImage.split(':')[0]}
                          </p>
                          <button
                            onClick={() => {
                              setCustomPort('')
                              setCustomName('')
                              setShowInstall(app)
                            }}
                            disabled={isInstalled}
                            className={`w-full mt-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                              isInstalled
                                ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                                : 'btn-primary'
                            }`}
                          >
                            {isInstalled ? (
                              'Já instalado'
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Instalar
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Installed Tab */}
      {activeTab === 'installed' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : installed.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-20 text-dark-500">
              <AppWindow className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">Nenhum app instalado</p>
              <p className="text-sm mt-1">Vá ao catálogo para instalar apps</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {installed.map((app) => {
                const catalogInfo = catalog.find(c => c.id === app.app_id)
                return (
                  <div key={app.id} className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{catalogInfo?.icon || '📦'}</span>
                      <div>
                        <h3 className="text-dark-200 font-semibold">{app.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-dark-500">
                          <span>Porta: {app.port}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            app.status === 'running'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-dark-600/50 text-dark-400'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.status === 'running' ? (
                        <button
                          onClick={() => handleAction(app.id, 'stop')}
                          className="btn-secondary py-2 px-3 flex items-center gap-1"
                        >
                          <Square className="w-4 h-4" />
                          Parar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(app.id, 'start')}
                          className="btn-primary py-2 px-3 flex items-center gap-1"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </button>
                      )}
                      <a
                        href={`http://localhost:${app.port}`}
                        target="_blank"
                        className="btn-secondary py-2 px-3"
                        title="Abrir"
                      >
                        <ExternalLink className="w-4 h-4 text-dark-400" />
                      </a>
                      <button
                        onClick={() => handleUninstall(app.id, app.name)}
                        className="btn-danger py-2 px-3"
                        title="Desinstalar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
