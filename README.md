# 🚀 Painel udiaas

Painel de gerenciamento de servidor VPS — leve, moderno e completo.

## ✨ Funcionalidades

- **📊 Dashboard** — Monitoramento em tempo real (CPU, RAM, Disco, Rede)
- **📁 File Manager** — Upload, edição, criação de pastas via navegador
- **🌐 Domínios** — Gerenciamento de domínios com SSL automático
- **📄 Sites Estáticos** — Crie e publique sites com templates prontos
- **📦 Apps** — Instale Typebot, n8n, WordPress, Portainer e mais via Docker
- **🐳 Docker** — Gerencie containers, logs, start/stop
- **⚙️ Configurações** — Altere senha, veja info do sistema

## 🛠️ Stack Técnica

| Componente | Tecnologia |
|------------|------------|
| Frontend | React + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Banco | SQLite (leve, zero config) |
| Proxy | Nginx (produção) |
| SSL | Let's Encrypt (Certbot) |
| Containers | Docker + Docker Compose |
| Process Manager | PM2 |

## 📋 Requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Mínimo 1GB RAM (2GB+ recomendado)
- Acesso root (SSH)

## 🚀 Instalação Rápida (VPS)

### Método 1: Script automático (recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/painel-udiaas.git
cd painel-udiaas

# Execute o instalador
sudo bash install.sh
```

O script irá:
1. ✅ Instalar Node.js 20 LTS
2. ✅ Instalar Docker + Docker Compose
3. ✅ Instalar Nginx
4. ✅ Instalar Certbot (SSL)
5. ✅ Configurar o painel
6. ✅ Configurar firewall (UFW)
7. ✅ Configurar PM2 (auto-start)
8. ✅ Configurar SSL (opcional)

### Método 2: Docker

```bash
# Clone e suba com Docker
git clone https://github.com/seu-usuario/painel-udiaas.git
cd painel-udiaas

# Crie o arquivo .env
cp .env.example .env
# Edite o .env com suas configurações

# Suba os containers
docker-compose up -d

# Acesse: http://SEU-IP:3001
```

### Método 3: Manual

```bash
# Instale Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Clone o projeto
git clone https://github.com/seu-usuario/painel-udiaas.git
cd painel-udiaas

# Instale dependências
npm install
cd client && npm install && npm run build && cd ..

# Configure o .env
cp .env.example .env
# Edite o .env

# Inicie o painel
npm start
```

## 🔧 Comandos Úteis

```bash
# PM2 (process manager)
pm2 status                    # Status do painel
pm2 logs painel-udiaas        # Ver logs
pm2 restart painel-udiaas     # Reiniciar
pm2 stop painel-udiaas        # Parar

# Docker
docker ps                     # Listar containers
docker logs <container>       # Ver logs
docker restart <container>    # Reiniciar container

# Nginx
sudo nginx -t                 # Testar configuração
sudo systemctl reload nginx   # Recarregar

# Firewall
sudo ufw status               # Ver regras
sudo ufw allow 8080/tcp       # Liberar porta

# SSL
sudo certbot renew            # Renovar certificados
```

## 📁 Estrutura

```
painel-udiaas/
├── server/               # Backend (Node.js + Express)
│   ├── index.js          # Servidor principal
│   ├── routes/           # Rotas da API
│   │   ├── auth.js       # Autenticação
│   │   ├── dashboard.js  # Stats do servidor
│   │   ├── files.js      # File manager
│   │   ├── domains.js    # Domínios
│   │   ├── sites.js      # Sites estáticos
│   │   └── apps.js       # Apps Docker
│   ├── middleware/       # Middlewares
│   └── utils/            # Utilitários
├── client/               # Frontend (React + Tailwind)
│   ├── src/
│   │   ├── pages/        # Páginas
│   │   ├── components/   # Componentes
│   │   └── lib/          # Utilitários
│   └── dist/             # Build de produção
├── data/                 # Dados persistentes
│   ├── sites/            # Arquivos dos sites
│   └── files/            # File manager
├── install.sh            # Script de instalação
├── Dockerfile            # Docker image
├── docker-compose.yml    # Docker Compose
└── README.md             # Este arquivo
```

## 🔐 Segurança

- [ ] Altere a senha padrão após o primeiro login
- [ ] Configure HTTPS com Let's Encrypt
- [ ] Mantenha o sistema atualizado (`apt update && apt upgrade`)
- [ ] Use firewall (UFW) para limitar portas
- [ ] Faça backups regulares dos dados
- [ ] Não exponha portas desnecessárias

## 🐛 Solução de Problemas

**Painel não inicia:**
```bash
pm2 logs painel-udiaas  # Ver logs de erro
```

**Porta 3001 em uso:**
```bash
sudo lsof -i :3001      # Ver o que está usando
sudo kill -9 <PID>       # Matar processo
```

**Docker não funciona:**
```bash
sudo systemctl status docker
sudo systemctl restart docker
```

**SSL não renova:**
```bash
sudo certbot renew --dry-run  # Testar renovação
```

## 📄 Licença

MIT License — use como quiser! 🎉

---

**Feito com 💜 para a comunidade**
