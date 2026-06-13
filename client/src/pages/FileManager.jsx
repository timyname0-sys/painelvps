import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FolderOpen, File, FileCode, FileText, FileImage, FileVideo, FileAudio,
  ArrowLeft, Home, Upload, FolderPlus, Trash2, Edit3, Download,
  RefreshCw, Search, MoreVertical, X, Save, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

function getFileIcon(name, isDir) {
  if (isDir) return FolderOpen
  const ext = name.split('.').pop()?.toLowerCase()
  if (['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte'].includes(ext)) return FileCode
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return FileImage
  if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return FileVideo
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return FileAudio
  if (['js', 'ts', 'py', 'rb', 'go', 'rs', 'php', 'java', 'css', 'scss', 'json', 'yaml', 'yml', 'toml', 'sh', 'bash'].includes(ext)) return FileCode
  return FileText
}

function getFileColor(name, isDir) {
  if (isDir) return 'text-blue-400'
  const ext = name.split('.').pop()?.toLowerCase()
  if (['html', 'htm'].includes(ext)) return 'text-orange-400'
  if (['js', 'jsx'].includes(ext)) return 'text-yellow-400'
  if (['ts', 'tsx'].includes(ext)) return 'text-blue-400'
  if (['py'].includes(ext)) return 'text-green-400'
  if (['css', 'scss'].includes(ext)) return 'text-pink-400'
  if (['json'].includes(ext)) return 'text-emerald-400'
  if (['md'].includes(ext)) return 'text-gray-400'
  if (['sh', 'bash'].includes(ext)) return 'text-green-500'
  return 'text-dark-400'
}

function formatSize(bytes) {
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function FileManager() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [files, setFiles] = useState([])
  const [currentPath, setCurrentPath] = useState(searchParams.get('path') || '')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingFile, setEditingFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => {
    fetchFiles()
  }, [currentPath])

  async function fetchFiles() {
    setLoading(true)
    try {
      const { data } = await api.get('/files/list', { params: { path: currentPath } })
      setFiles(data.files || [])
    } catch (err) {
      toast.error('Erro ao carregar arquivos')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  function navigateTo(path) {
    setCurrentPath(path)
    setSearchParams(path ? { path } : {})
  }

  function navigateUp() {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    navigateTo(parts.join('/'))
  }

  async function handleOpenFile(file) {
    if (file.isDirectory) {
      navigateTo(file.path)
    } else {
      try {
        const { data } = await api.get('/files/read', { params: { path: file.path } })
        setEditingFile(file)
        setFileContent(data.content)
      } catch (err) {
        toast.error('Erro ao abrir arquivo')
      }
    }
  }

  async function handleSaveFile() {
    setSaving(true)
    try {
      await api.post('/files/write', {
        filePath: editingFile.path,
        content: fileContent
      })
      toast.success('Arquivo salvo!')
      setEditingFile(null)
      fetchFiles()
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    try {
      const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName
      await api.post('/files/mkdir', { dirPath: fullPath })
      toast.success('Pasta criada!')
      setShowNewFolder(false)
      setNewFolderName('')
      fetchFiles()
    } catch (err) {
      toast.error('Erro ao criar pasta')
    }
  }

  async function handleDelete(file) {
    if (!confirm(`Tem certeza que deseja excluir "${file.name}"?`)) return
    try {
      await api.delete('/files/delete', { data: { filePath: file.path } })
      toast.success('Removido!')
      fetchFiles()
    } catch (err) {
      toast.error('Erro ao remover')
    }
  }

  async function handleUpload(e) {
    const files = e.target.files
    if (!files.length) return

    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }

    try {
      await api.post(`/files/upload?path=${currentPath}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`${files.length} arquivo(s) enviado(s)!`)
      fetchFiles()
    } catch (err) {
      toast.error('Erro no upload')
    }
    e.target.value = ''
  }

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const breadcrumbs = currentPath.split('/').filter(Boolean)

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">File Manager</h1>
          <p className="text-dark-400 mt-1">Gerencie os arquivos do servidor</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-primary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload
            <input type="file" multiple className="hidden" onChange={handleUpload} />
          </label>
          <button onClick={() => setShowNewFolder(true)} className="btn-secondary flex items-center gap-2">
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button onClick={fetchFiles} className="btn-secondary p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumbs + Search */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button onClick={() => navigateTo('')} className="text-dark-400 hover:text-indigo-400 transition-colors">
            <Home className="w-4 h-4" />
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-dark-600">/</span>
              <button
                onClick={() => navigateTo(breadcrumbs.slice(0, i + 1).join('/'))}
                className="text-dark-300 hover:text-indigo-400 transition-colors"
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 py-2 text-sm"
          />
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="glass-card p-4 flex items-center gap-3">
          <FolderPlus className="w-5 h-5 text-blue-400" />
          <input
            type="text"
            placeholder="Nome da pasta..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="input-field py-2 text-sm flex-1"
            autoFocus
          />
          <button onClick={handleCreateFolder} className="btn-primary py-2 text-sm">Criar</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="btn-secondary py-2 text-sm">Cancelar</button>
        </div>
      )}

      {/* File List */}
      <div className="glass-card flex-1 overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider border-b border-dark-700/50">
          <div className="col-span-6 sm:col-span-5">Nome</div>
          <div className="col-span-2 hidden sm:block text-right">Tamanho</div>
          <div className="col-span-3 hidden sm:block text-right">Modificado</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {/* Back button */}
        {currentPath && (
          <button
            onClick={navigateUp}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-dark-800/50 transition-colors border-b border-dark-700/30 items-center"
          >
            <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
              <ArrowLeft className="w-4 h-4 text-dark-400" />
              <span className="text-dark-400 text-sm">..</span>
            </div>
          </button>
        )}

        {/* Files */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-dark-500">
              <FolderOpen className="w-12 h-12 mb-3" />
              <p>Nenhum arquivo encontrado</p>
            </div>
          ) : (
            filteredFiles.map((file, i) => {
              const Icon = getFileIcon(file.name, file.isDirectory)
              const color = getFileColor(file.name, file.isDirectory)

              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-dark-800/50 transition-colors border-b border-dark-700/30 items-center group cursor-pointer"
                  onDoubleClick={() => handleOpenFile(file)}
                >
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                    <span className="text-dark-200 text-sm truncate">{file.name}</span>
                  </div>
                  <div className="col-span-2 hidden sm:block text-right text-sm text-dark-400">
                    {file.isDirectory ? '-' : formatSize(file.size)}
                  </div>
                  <div className="col-span-3 hidden sm:block text-right text-sm text-dark-500">
                    {new Date(file.modified).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!file.isDirectory && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenFile(file) }}
                        className="p-1 hover:bg-dark-600 rounded"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-dark-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(file) }}
                      className="p-1 hover:bg-red-500/20 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
                <button onClick={() => setEditingFile(null)} className="p-2 hover:bg-dark-700 rounded-lg">
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
    </div>
  )
}
