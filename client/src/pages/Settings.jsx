import { useState } from 'react'
import {
  Settings as SettingsIcon, Lock, Shield, Server, Save,
  Loader2, Eye, EyeOff, Check, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      })
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Configurações</h1>
        <p className="text-dark-400 mt-1">Gerencie as configurações do painel</p>
      </div>

      {/* Change Password */}
      <div className="glass-card">
        <div className="flex items-center gap-3 p-6 border-b border-dark-700/50">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-200">Alterar Senha</h2>
            <p className="text-sm text-dark-500">Atualize sua senha de acesso</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Senha Atual</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pr-10"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Nova Senha</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Confirmar Nova Senha</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-sm text-dark-400 hover:text-dark-200 flex items-center gap-1 transition-colors"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
            </button>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* System Info */}
      <div className="glass-card">
        <div className="flex items-center gap-3 p-6 border-b border-dark-700/50">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-200">Informações do Sistema</h2>
            <p className="text-sm text-dark-500">Detalhes do painel e servidor</p>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {[
            { label: 'Versão do Painel', value: 'v1.0.0' },
            { label: 'Ambiente', value: 'Produção' },
            { label: 'Plataforma', value: 'Node.js + React' },
            { label: 'Banco de Dados', value: 'SQLite' },
            { label: 'Proxy', value: 'Nginx (configurado via install script)' },
            { label: 'SSL', value: 'Let\'s Encrypt (Certbot)' },
            { label: 'Containerização', value: 'Docker + Docker Compose' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700/30 last:border-0">
              <span className="text-sm text-dark-400">{item.label}</span>
              <span className="text-sm text-dark-200 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Tips */}
      <div className="glass-card">
        <div className="flex items-center gap-3 p-6 border-b border-dark-700/50">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Shield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-200">Segurança</h2>
            <p className="text-sm text-dark-500">Dicas para manter seu painel seguro</p>
          </div>
        </div>
        <div className="p-6 space-y-3 text-sm text-dark-400">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p>Altere a senha padrão imediatamente após a instalação</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p>Use HTTPS com Let's Encrypt para todas as conexões</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p>Mantenha o sistema e o Docker atualizados</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p>Configure firewall (UFW) para permitir apenas portas necessárias</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p>Faça backups regulares dos dados e bancos de dados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
