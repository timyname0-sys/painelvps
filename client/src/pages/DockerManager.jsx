import { useState, useEffect } from 'react'
import {
  Container, RefreshCw, Play, Square, Trash2, RotateCcw,
  Loader2, Terminal, Eye, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle, Clock, Pause
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

// Docker manager - usa API do Docker via backend
// Por enquanto mostra containers simulados até conectar ao Docker real

const STATUS_ICONS = {
  running: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  stopped: { icon: Pause, color: 'text-dark-400', bg: 'bg-dark-700' },
  restarting: { icon: RotateCcw, color: 'text-yellow-400 animate-spin', bg: 'bg-yellow-500/10' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' }
}

export default function DockerManager() {
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedContainer, setExpandedContainer] = useState(null)
  const [logs, setLogs] = useState({})
  const [loadingLogs, setLoadingLogs] = useState(null)

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchContainers() {
    try {
      // Por enquanto, dados simulados até integrar com Docker real
      // Em produção, fazer GET /api/docker/containers
      const mockContainers = [
        {
          id: 'abc123def456',
          name: 'painel-udiaas',
          image: 'node:18-alpine',
          status: 'running',
          created: new Date().toISOString(),
          ports: '3001:3001',
          cpu: '0.5%',
          memory: '128MB / 512MB',
          uptime: '2h 30m'
        }
      ]
      setContainers(mockContainers)
    } catch (err) {
      console.error('Erro ao buscar containers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id, action) {
    try {
      // Simulado - em produção: await api.post(`/api/docker/${id}/${action}`)
      toast.success(`Container ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'}!`)
      fetchContainers()
    } catch (err) {
      toast.error(`Erro ao ${action} container`)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remover container "${name}"?`)) return
    try {
      toast.success('Container removido!')
      fetchContainers()
    } catch (err) {
      toast.error('Erro ao remover container')
    }
  }

  async function viewLogs(id) {
    if (expandedContainer === id) {
      setExpandedContainer(null)
      return
    }
    setExpandedContainer(id)
    setLoadingLogs(id)
    try {
      // Simulado - em produção: const { data } = await api.get(`/api/docker/${id}/logs`)
      setLogs(prev => ({
        ...prev,
        [id]: [
          '[2024-01-15 10:30:00] Server started on port 3001',
          '[2024-01-15 10:30:01] Connected to database',
          '[2024-01-15 10:30:02] Ready to accept connections',
          `[2024-01-15 10:31:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}] GET /api/dashboard/stats 200 - 15ms`,
          `[2024-01-15 10:32:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}] GET /api/files/list 200 - 8ms`,
        ]
      }))
    } catch (err) {
      toast.error('Erro ao carregar logs')
    } finally {
      setLoadingLogs(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Docker Manager</h1>
          <p className="text-dark-400 mt-1">Gerencie containers Docker</p>
        </div>
        <button onClick={fetchContainers} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Docker Status */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Container className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-dark-200 font-medium">Status do Docker</h3>
            <p className="text-sm text-dark-500">{containers.length} container(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-400">Ativo</span>
        </div>
      </div>

      {/* Containers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : containers.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-dark-500">
          <Container className="w-12 h-12 mb-3" />
          <p className="text-lg font-medium">Nenhum container encontrado</p>
          <p className="text-sm mt-1">Instale apps para criar containers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {containers.map((container) => {
            const statusConfig = STATUS_ICONS[container.status] || STATUS_ICONS.stopped
            const StatusIcon = statusConfig.icon
            const isExpanded = expandedContainer === container.id

            return (
              <div key={container.id} className="glass-card overflow-hidden">
                {/* Container Header */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <h3 className="text-dark-200 font-semibold">{container.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-dark-500">
                        <span className="font-mono text-xs">{container.id.substring(0, 12)}</span>
                        <span>•</span>
                        <span>{container.image}</span>
                        <span>•</span>
                        <span>Ports: {container.ports}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right text-sm">
                      <p className="text-dark-300">CPU: {container.cpu}</p>
                      <p className="text-dark-500">RAM: {container.memory}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {container.status === 'running' ? (
                        <>
                          <button
                            onClick={() => handleAction(container.id, 'stop')}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Parar"
                          >
                            <Square className="w-4 h-4 text-yellow-400" />
                          </button>
                          <button
                            onClick={() => handleAction(container.id, 'restart')}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Reiniciar"
                          >
                            <RotateCcw className="w-4 h-4 text-blue-400" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAction(container.id, 'start')}
                          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                          title="Iniciar"
                        >
                          <Play className="w-4 h-4 text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={() => viewLogs(container.id)}
                        className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        title="Logs"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-dark-400" />
                        ) : (
                          <Terminal className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(container.id, container.name)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logs */}
                {isExpanded && (
                  <div className="border-t border-dark-700/50 bg-dark-950/50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-dark-300">Logs</h4>
                        {loadingLogs === container.id && (
                          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                        )}
                      </div>
                      <div className="bg-dark-950 rounded-lg p-4 font-mono text-xs text-dark-400 max-h-48 overflow-y-auto space-y-1">
                        {(logs[container.id] || []).map((line, i) => (
                          <div key={i} className="hover:text-dark-200 transition-colors">
                            {line}
                          </div>
                        ))}
                        {(!logs[container.id] || logs[container.id].length === 0) && (
                          <p className="text-dark-600">Nenhum log disponível</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="glass-card p-4 text-sm text-dark-500">
        <p>💡 <strong className="text-dark-300">Dica:</strong> Para gerenciar containers Docker diretamente, instale o <strong>Portainer</strong> no catálogo de Apps.</p>
        <p className="mt-1">O painel usa Docker via API. Certifique-se de que o Docker está instalado na VPS.</p>
      </div>
    </div>
  )
}
