import { useState, useEffect } from 'react'
import {
  Cpu, HardDrive, MemoryStick, Network, Clock, Server,
  Activity, ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react'
import api from '../lib/api'

function StatCard({ icon: Icon, label, value, subValue, color, trend }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {trend && (
          <span className={`text-xs flex items-center gap-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-dark-100">{value}</p>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
        {subValue && <p className="text-xs text-dark-500 mt-1">{subValue}</p>}
      </div>
    </div>
  )
}

function UsageBar({ label, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-dark-300">{label}</span>
        <span className="text-dark-400">{percent?.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(percent || 0, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAll() {
    try {
      const [statsRes, procRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/processes')
      ])
      setStats(statsRes.data)
      setProcesses(procRes.data.processes || [])
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function handleRefresh() {
    setRefreshing(true)
    fetchAll()
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Dashboard</h1>
          <p className="text-dark-400 mt-1">Visão geral do servidor</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Cpu}
          label="CPU"
          value={`${stats?.cpu?.usage?.toFixed(1)}%`}
          subValue={`${stats?.cpu?.cores} cores — ${stats?.cpu?.model?.substring(0, 30)}...`}
          color="green"
        />
        <StatCard
          icon={MemoryStick}
          label="Memória RAM"
          value={`${stats?.memory?.usagePercent?.toFixed(1)}%`}
          subValue={`${formatBytes(stats?.memory?.used)} / ${formatBytes(stats?.memory?.total)}`}
          color="blue"
        />
        <StatCard
          icon={HardDrive}
          label="Disco"
          value={`${stats?.disk?.[0]?.usagePercent?.toFixed(1)}%`}
          subValue={`${formatBytes(stats?.disk?.[0]?.used)} / ${formatBytes(stats?.disk?.[0]?.size)}`}
          color="purple"
        />
        <StatCard
          icon={Clock}
          label="Uptime"
          value={stats?.system?.uptime}
          subValue={`${stats?.system?.platform} ${stats?.system?.arch}`}
          color="orange"
        />
      </div>

      {/* Usage Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">Uso de Recursos</h3>
          <div className="space-y-4">
            <UsageBar
              label="CPU"
              percent={stats?.cpu?.usage}
              color="from-green-500 to-emerald-500"
            />
            <UsageBar
              label="Memória RAM"
              percent={stats?.memory?.usagePercent}
              color="from-blue-500 to-cyan-500"
            />
            {stats?.disk?.map((d, i) => (
              <UsageBar
                key={i}
                label={`Disco ${d.mount}`}
                percent={d.usagePercent}
                color="from-purple-500 to-pink-500"
              />
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">Informações do Sistema</h3>
          <div className="space-y-3">
            {[
              { label: 'Hostname', value: stats?.system?.hostname, icon: Server },
              { label: 'Plataforma', value: `${stats?.system?.platform} ${stats?.system?.arch}`, icon: Server },
              { label: 'Node.js', value: stats?.system?.nodeVersion, icon: Activity },
              { label: 'Uptime', value: stats?.system?.uptime, icon: Clock },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700/50 last:border-0">
                  <div className="flex items-center gap-2 text-dark-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="text-sm text-dark-200 font-mono">{item.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Network */}
      {stats?.network?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">Rede</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dark-400 border-b border-dark-700">
                  <th className="text-left py-2">Interface</th>
                  <th className="text-right py-2">Download</th>
                  <th className="text-right py-2">Upload</th>
                  <th className="text-right py-2">Total RX</th>
                  <th className="text-right py-2">Total TX</th>
                </tr>
              </thead>
              <tbody>
                {stats.network.map((n, i) => (
                  <tr key={i} className="border-b border-dark-700/50">
                    <td className="py-2 text-dark-200 font-mono">{n.iface}</td>
                    <td className="py-2 text-right text-green-400">
                      <ArrowDown className="w-3 h-3 inline mr-1" />
                      {formatBytes(n.rx_sec)}/s
                    </td>
                    <td className="py-2 text-right text-blue-400">
                      <ArrowUp className="w-3 h-3 inline mr-1" />
                      {formatBytes(n.tx_sec)}/s
                    </td>
                    <td className="py-2 text-right text-dark-300">{formatBytes(n.rx_bytes)}</td>
                    <td className="py-2 text-right text-dark-300">{formatBytes(n.tx_bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Processes */}
      {processes.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">Top Processos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dark-400 border-b border-dark-700">
                  <th className="text-left py-2">PID</th>
                  <th className="text-left py-2">Nome</th>
                  <th className="text-right py-2">CPU %</th>
                  <th className="text-right py-2">RAM %</th>
                  <th className="text-right py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {processes.slice(0, 10).map((p, i) => (
                  <tr key={i} className="border-b border-dark-700/50 hover:bg-dark-800/30">
                    <td className="py-2 text-dark-400 font-mono">{p.pid}</td>
                    <td className="py-2 text-dark-200">{p.name}</td>
                    <td className="py-2 text-right text-green-400">{p.cpu}%</td>
                    <td className="py-2 text-right text-blue-400">{p.mem}%</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        p.state === 'running' ? 'bg-green-500/20 text-green-400' :
                        p.state === 'sleeping' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-dark-600/50 text-dark-400'
                      }`}>
                        {p.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
