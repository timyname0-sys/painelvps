import { useState, useEffect } from 'react'
import {
  Globe, Plus, Trash2, Shield, ExternalLink, RefreshCw,
  X, Loader2, Lock, Unlock, Copy, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function Domains() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [targetPort, setTargetPort] = useState('')
  const [targetPath, setTargetPath] = useState('')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetchDomains()
  }, [])

  async function fetchDomains() {
    try {
      const { data } = await api.get('/domains')
      setDomains(data.domains || [])
    } catch (err) {
      toast.error('Erro ao carregar domínios')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    try {
      await api.post('/domains', {
        domain: newDomain,
        target_port: targetPort ? parseInt(targetPort) : null,
        target_path: targetPath || null
      })
      toast.success('Domínio adicionado!')
      setShowAdd(false)
      setNewDomain('')
      setTargetPort('')
      setTargetPath('')
      fetchDomains()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar domínio')
    }
  }

  async function handleDelete(id, domain) {
    if (!confirm(`Remover o domínio "${domain}"?`)) return
    try {
      await api.delete(`/domains/${id}`)
      toast.success('Domínio removido!')
      fetchDomains()
    } catch (err) {
      toast.error('Erro ao remover')
    }
  }

  async function handleToggleSSL(id) {
    try {
      await api.post(`/domains/${id}/ssl`)
      toast.success('SSL atualizado!')
      fetchDomains()
    } catch (err) {
      toast.error('Erro ao configurar SSL')
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copiado!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Domínios</h1>
          <p className="text-dark-400 mt-1">Gerencie domínios e SSL</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDomains} className="btn-secondary p-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Domínio
          </button>
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
              <h2 className="text-lg font-semibold text-dark-200">Novo Domínio</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Domínio</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="input-field"
                  placeholder="exemplo.com.br"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Porta de destino (opcional)</label>
                <input
                  type="number"
                  value={targetPort}
                  onChange={(e) => setTargetPort(e.target.value)}
                  className="input-field"
                  placeholder="3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Caminho de destino (opcional)</label>
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  className="input-field"
                  placeholder="/var/www/site"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DNS Info */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-dark-300 mb-3">📋 Configure o DNS do seu domínio:</h3>
        <div className="flex items-center gap-2 bg-dark-900/50 rounded-lg p-3">
          <code className="text-sm text-indigo-400 font-mono flex-1">
            A registro → aponte para o IP do seu servidor
          </code>
          <button onClick={() => copyToClipboard('A registro → aponte para o IP do seu servidor')} className="p-1 hover:bg-dark-700 rounded">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-dark-400" />}
          </button>
        </div>
      </div>

      {/* Domains List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-dark-500">
          <Globe className="w-12 h-12 mb-3" />
          <p className="text-lg font-medium">Nenhum domínio configurado</p>
          <p className="text-sm mt-1">Adicione um domínio para começar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {domains.map((d) => (
            <div key={d.id} className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-dark-600/50 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${d.ssl_enabled ? 'bg-green-500/10' : 'bg-dark-700'}`}>
                  {d.ssl_enabled ? (
                    <Lock className="w-5 h-5 text-green-400" />
                  ) : (
                    <Unlock className="w-5 h-5 text-dark-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-dark-200 font-medium">{d.domain}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                    {d.target_port && <span>Porta: {d.target_port}</span>}
                    {d.target_path && <span>Caminho: {d.target_path}</span>}
                    <span className={`px-2 py-0.5 rounded ${
                      d.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`https://${d.domain}`}
                  target="_blank"
                  rel="noopener"
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  title="Abrir site"
                >
                  <ExternalLink className="w-4 h-4 text-dark-400" />
                </a>
                <button
                  onClick={() => handleToggleSSL(d.id)}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  title="Configurar SSL"
                >
                  <Shield className={`w-4 h-4 ${d.ssl_enabled ? 'text-green-400' : 'text-dark-400'}`} />
                </button>
                <button
                  onClick={() => handleDelete(d.id, d.domain)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
