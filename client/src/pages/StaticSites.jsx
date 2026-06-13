import { useState, useEffect } from 'react'
import {
  FileCode, Plus, Trash2, ExternalLink, Edit3, RefreshCw,
  X, Loader2, Globe, Eye, Layout, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function StaticSites() {
  const [sites, setSites] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [siteFiles, setSiteFiles] = useState([])
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [newSite, setNewSite] = useState({ name: '', template: 'blank', domain: '' })

  useEffect(() => {
    fetchSites()
    fetchTemplates()
  }, [])

  async function fetchSites() {
    try {
      const { data } = await api.get('/sites')
      setSites(data.sites || [])
    } catch (err) {
      toast.error('Erro ao carregar sites')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTemplates() {
    try {
      const { data } = await api.get('/sites/templates')
      setTemplates(data.templates || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/sites', newSite)
      toast.success('Site criado com sucesso!')
      setShowCreate(false)
      setNewSite({ name: '', template: 'blank', domain: '' })
      fetchSites()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar site')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remover o site "${name}"? Todos os arquivos serão excluídos.`)) return
    try {
      await api.delete(`/sites/${id}`)
      toast.success('Site removido!')
      fetchSites()
    } catch (err) {
      toast.error('Erro ao remover site')
    }
  }

  async function openSiteManager(site) {
    setEditingSite(site)
    try {
      const { data } = await api.get(`/sites/${site.slug}/files`)
      setSiteFiles(data.files || [])
    } catch (err) {
      toast.error('Erro ao carregar arquivos')
    }
  }

  async function openFileEditor(site, fileName) {
    try {
      const { data } = await api.get(`/sites/${site.slug}/file`, { params: { name: fileName } })
      setEditingFile({ site, name: fileName })
      setFileContent(data.content)
    } catch (err) {
      toast.error('Erro ao abrir arquivo')
    }
  }

  async function handleSaveFile() {
    if (!editingFile) return
    setSaving(true)
    try {
      await api.put(`/sites/${editingFile.site.slug}/file`, {
        name: editingFile.name,
        content: fileContent
      })
      toast.success('Arquivo salvo!')
      setEditingFile(null)
      openSiteManager(editingFile.site)
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Sites Estáticos</h1>
          <p className="text-dark-400 mt-1">Crie e gerencie sites estáticos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSites} className="btn-secondary p-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Criar Site
          </button>
        </div>
      </div>

      {/* Create Site Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
              <h2 className="text-lg font-semibold text-dark-200">Novo Site</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Nome do Site</label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="input-field"
                  placeholder="Meu Site"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Domínio (opcional)</label>
                <input
                  type="text"
                  value={newSite.domain}
                  onChange={(e) => setNewSite({ ...newSite, domain: e.target.value })}
                  className="input-field"
                  placeholder="meusite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Template</label>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewSite({ ...newSite, template: t.id })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        newSite.template === t.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-dark-600 hover:border-dark-500 text-dark-400'
                      }`}
                    >
                      <Layout className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Criar Site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Manager Modal */}
      {editingSite && !editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-lg font-semibold text-dark-200">{editingSite.name}</h2>
                  <p className="text-xs text-dark-500">/{editingSite.slug}</p>
                </div>
              </div>
              <button onClick={() => setEditingSite(null)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {siteFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-200 text-sm">{f.name}</span>
                    <span className="text-xs text-dark-500">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button
                    onClick={() => openFileEditor(editingSite, f.name)}
                    className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <span className="text-dark-200 font-medium">{editingFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSaveFile} disabled={saving} className="btn-primary py-2 text-sm flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>
                <button onClick={() => { setEditingFile(null); openSiteManager(editingFile.site) }} className="p-2 hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full h-full min-h-[400px] bg-dark-900 text-dark-200 font-mono text-sm p-4 rounded-lg border border-dark-700 focus:outline-none focus:border-indigo-500 resize-none"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sites Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : sites.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-dark-500">
          <FileCode className="w-12 h-12 mb-3" />
          <p className="text-lg font-medium">Nenhum site criado</p>
          <p className="text-sm mt-1">Crie um site estático para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="glass-card p-5 hover:border-dark-600/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <FileCode className="w-5 h-5 text-indigo-400" />
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  site.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {site.status}
                </span>
              </div>
              <h3 className="text-dark-200 font-semibold text-lg">{site.name}</h3>
              <p className="text-dark-500 text-sm mt-1">/{site.slug}</p>
              {site.domain && (
                <p className="text-dark-400 text-sm mt-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {site.domain}
                </p>
              )}
              <p className="text-xs text-dark-600 mt-2">
                Template: {site.template} • {new Date(site.created_at).toLocaleDateString('pt-BR')}
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700/50">
                <button
                  onClick={() => openSiteManager(site)}
                  className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <a
                  href={`/sites/${site.slug}/`}
                  target="_blank"
                  className="btn-secondary py-2 px-3"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4 text-dark-400" />
                </a>
                <button
                  onClick={() => handleDelete(site.id, site.name)}
                  className="btn-danger py-2 px-3"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
