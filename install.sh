#!/bin/bash

# ============================================
# 🚀 PAINEL UDIAAS - Script de Instalação
# Compatível com: Ubuntu 20.04/22.04/24.04, Debian 11/12
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funções utilitárias
print_banner() {
    echo -e "${PURPLE}"
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║                                          ║"
    echo "  ║     🚀 PAINEL UDIAAS - Instalador       ║"
    echo "  ║                                          ║"
    echo "  ║     Painel de Gerenciamento de VPS       ║"
    echo "  ║                                          ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# ============================================
# VERIFICAÇÕES INICIAIS
# ============================================
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script precisa ser executado como root. Use: sudo bash install.sh"
    fi
}

check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID

        if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
            error "Sistema operacional não suportado: $OS. Use Ubuntu ou Debian."
        fi

        log "Sistema detectado: $OS $OS_VERSION"
    else
        error "Não foi possível detectar o sistema operacional"
    fi
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================
install_dependencies() {
    log "Atualizando sistema..."
    apt-get update -qq
    apt-get upgrade -y -qq

    log "Instalando dependências básicas..."
    apt-get install -y -qq \
        curl \
        wget \
        git \
        unzip \
        build-essential \
        ca-certificates \
        gnupg \
        lsb-release \
        software-properties-common \
        apt-transport-https \
        jq \
        htop \
        nano \
        ufw
}

# ============================================
# INSTALAÇÃO DO NODE.JS
# ============================================
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log "Node.js já instalado: $NODE_VERSION"
    else
        log "Instalando Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y -qq nodejs
        log "Node.js $(node -v) instalado"
    fi

    # Instalar PM2 globalmente
    if ! command -v pm2 &> /dev/null; then
        log "Instalando PM2 (process manager)..."
        npm install -g pm2
        pm2 startup
    fi
}

# ============================================
# INSTALAÇÃO DO DOCKER
# ============================================
install_docker() {
    if command -v docker &> /dev/null; then
        log "Docker já instalado: $(docker -v)"
    else
        log "Instalando Docker..."
        curl -fsSL https://get.docker.com | bash
        systemctl enable docker
        systemctl start docker
        log "Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) instalado"
    fi

    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        log "Docker Compose já instalado"
    else
        log "Instalando Docker Compose..."
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r '.tag_name')
        curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log "Docker Compose instalado"
    fi
}

# ============================================
# INSTALAÇÃO DO NGINX
# ============================================
install_nginx() {
    if command -v nginx &> /dev/null; then
        log "Nginx já instalado"
    else
        log "Instalando Nginx..."
        apt-get install -y -qq nginx
        systemctl enable nginx
        systemctl start nginx
        log "Nginx instalado"
    fi
}

# ============================================
# INSTALAÇÃO DO CERTBOT (SSL)
# ============================================
install_certbot() {
    if command -v certbot &> /dev/null; then
        log "Certbot já instalado"
    else
        log "Instalando Certbot (Let's Encrypt)..."
        apt-get install -y -qq certbot python3-certbot-nginx
        log "Certbot instalado"
    fi
}

# ============================================
# CONFIGURAÇÃO DO PAINEL
# ============================================
setup_panel() {
    INSTALL_DIR="/opt/painel-udiaas"

    log "Configurando Painel udiaas em $INSTALL_DIR..."

    # Criar diretório
    mkdir -p $INSTALL_DIR

    # Copiar arquivos (assumindo que estamos no diretório do projeto)
    if [[ -f "./package.json" ]]; then
        cp -r ./* $INSTALL_DIR/
        cp -r ./.env $INSTALL_DIR/ 2>/dev/null || true
    else
        error "Execute este script a partir do diretório do projeto"
    fi

    cd $INSTALL_DIR

    # Instalar dependências do backend
    log "Instalando dependências do backend..."
    npm install --production

    # Instalar e buildar o frontend
    log "Buildando frontend..."
    cd client
    npm install
    npm run build
    cd ..

    # Criar diretórios de dados
    mkdir -p data/sites data/files

    # Gerar JWT secret aleatório
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

    # Gerar senha admin aleatória
    ADMIN_PASS=$(openssl rand -base64 12)
    sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASS/" .env

    log "Painel configurado em: $INSTALL_DIR"
    info "Senha do admin: $ADMIN_PASS"
    info "Salve esta senha em um lugar seguro!"
}

# ============================================
# CONFIGURAÇÃO DO NGINX
# ============================================
setup_nginx() {
    log "Configurando Nginx..."

    # Obter IP público
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "SEU_IP")

    cat > /etc/nginx/sites-available/painel-udiaas << 'NGINX'
server {
    listen 80;
    server_name _;

    # Segurança
    server_tokens off;

    # Tamanho máximo de upload
    client_max_body_size 100M;

    # Proxy para o painel
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Sites estáticos servidos pelo painel
    location /sites/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

    # Ativar site
    ln -sf /etc/nginx/sites-available/painel-udiaas /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Testar e reiniciar
    nginx -t && systemctl reload nginx

    log "Nginx configurado"
    info "Acesse: http://$PUBLIC_IP"
}

# ============================================
# CONFIGURAÇÃO DO FIREWALL
# ============================================
setup_firewall() {
    log "Configurando firewall (UFW)..."

    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable

    log "Firewall configurado"
}

# ============================================
# CONFIGURAÇÃO DO PM2
# ============================================
setup_pm2() {
    log "Configurando PM2 para iniciar com o sistema..."

    cd /opt/painel-udiaas

    # Parar processo existente se houver
    pm2 delete painel-udiaas 2>/dev/null || true

    # Iniciar com PM2
    pm2 start server/index.js --name painel-udiaas --max-memory-restart 512M

    # Salvar configuração
    pm2 save

    # Configurar startup
    pm2 startup

    log "PM2 configurado - Painel inicia automaticamente no boot"
}

# ============================================
# CONFIGURAÇÃO DO SSL
# ============================================
setup_ssl() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Configuração SSL (Let's Encrypt)        ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo ""
    read -p "Deseja configurar SSL? (s/n): " SETUP_SSL

    if [[ "$SETUP_SSL" == "s" || "$SETUP_SSL" == "S" ]]; then
        read -p "Digite seu domínio (ex: painel.seudominio.com): " DOMAIN

        if [[ -n "$DOMAIN" ]]; then
            # Atualizar Nginx com o domínio
            sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/painel-udiaas
            systemctl reload nginx

            # Obter certificado
            certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

            log "SSL configurado para $DOMAIN"
            info "Acesse: https://$DOMAIN"

            # Renovação automática
            echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
            log "Renovação automática de SSL configurada"
        fi
    fi
}

# ============================================
# RESUMO DA INSTALAÇÃO
# ============================================
print_summary() {
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "SEU_IP")
    ADMIN_PASS=$(grep ADMIN_PASSWORD /opt/painel-udiaas/.env | cut -d'=' -f2)

    echo ""
    echo -e "${GREEN}"
    echo "  ╔══════════════════════════════════════════════════╗"
    echo "  ║                                                  ║"
    echo "  ║     ✅ PAINEL UDIAAS INSTALADO COM SUCESSO!     ║"
    echo "  ║                                                  ║"
    echo "  ╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "  ${CYAN}📊 Acesso:${NC}"
    echo -e "     URL:      http://$PUBLIC_IP"
    echo -e "     Usuário:  admin"
    echo -e "     Senha:    $ADMIN_PASS"
    echo ""
    echo -e "  ${CYAN}📁 Diretórios:${NC}"
    echo -e "     Painel:   /opt/painel-udiaas"
    echo -e "     Sites:    /opt/painel-udiaas/data/sites"
    echo -e "     Arquivos: /opt/painel-udiaas/data/files"
    echo ""
    echo -e "  ${CYAN}🔧 Comandos Úteis:${NC}"
    echo -e "     pm2 status              → Status do painel"
    echo -e "     pm2 logs painel-udiaas  → Ver logs"
    echo -e "     pm2 restart painel-udiaas → Reiniciar painel"
    echo -e "     ufw status              → Status do firewall"
    echo ""
    echo -e "  ${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo -e "     1. Altere a senha padrão após o primeiro login"
    echo -e "     2. Configure SSL com um domínio para HTTPS"
    echo -e "     3. Mantenha o sistema atualizado"
    echo ""
}

# ============================================
# MENU PRINCIPAL
# ============================================
main() {
    print_banner
    check_root
    check_os

    echo ""
    echo -e "${CYAN}Iniciando instalação...${NC}"
    echo ""

    install_dependencies
    install_nodejs
    install_docker
    install_nginx
    install_certbot
    setup_panel
    setup_nginx
    setup_firewall
    setup_pm2
    setup_ssl
    print_summary

    echo -e "${GREEN}Instalação concluída! 🚀${NC}"
}

# Executar
main "$@"
