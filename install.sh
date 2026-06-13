#!/bin/bash

# ============================================
# 🚀 PAINEL UDIAAS - Script de Instalação
# Compatível com: Ubuntu, Debian, CentOS, RHEL, Fedora, AlmaLinux, Rocky
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

# Detectar gerenciador de pacotes
detect_package_manager() {
    if command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    elif command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
    else
        error "Gerenciador de pacotes não encontrado"
    fi
    log "Gerenciador de pacotes: $PKG_MANAGER"
}

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

        case "$OS" in
            ubuntu|debian|centos|rhel|fedora|almalinux|rocky|ol|amzn)
                log "Sistema detectado: $OS $OS_VERSION"
                ;;
            *)
                warn "Sistema não testado: $OS. Tentando continuar..."
                ;;
        esac
    else
        error "Não foi possível detectar o sistema operacional"
    fi
}

# ============================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================
install_dependencies() {
    log "Atualizando sistema..."

    if [[ "$PKG_MANAGER" == "apt" ]]; then
        apt-get update -qq
        apt-get upgrade -y -qq

        log "Instalando dependências básicas..."
        apt-get install -y -qq \
            curl wget git unzip \
            build-essential ca-certificates \
            gnupg jq htop nano ufw
    else
        $PKG_MANAGER update -y -q 2>/dev/null || true
        $PKG_MANAGER upgrade -y -q 2>/dev/null || true

        log "Instalando dependências básicas..."
        $PKG_MANAGER install -y -q \
            curl wget git unzip \
            gcc gcc-c++ make \
            ca-certificates \
            jq htop nano
    fi
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

        if [[ "$PKG_MANAGER" == "apt" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y -qq nodejs
        else
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            $PKG_MANAGER install -y -q nodejs
        fi

        log "Node.js $(node -v) instalado"
    fi

    # Instalar PM2 globalmente
    if ! command -v pm2 &> /dev/null; then
        log "Instalando PM2 (process manager)..."
        npm install -g pm2
        pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup 2>/dev/null || true
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

    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
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

        if [[ "$PKG_MANAGER" == "apt" ]]; then
            apt-get install -y -qq nginx
        else
            $PKG_MANAGER install -y -q epel-release 2>/dev/null || true
            $PKG_MANAGER install -y -q nginx
        fi

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

        if [[ "$PKG_MANAGER" == "apt" ]]; then
            apt-get install -y -qq certbot python3-certbot-nginx
        else
            $PKG_MANAGER install -y -q certbot python3-certbot-nginx 2>/dev/null || \
            snap install certbot --classic 2>/dev/null || \
            {
                $PKG_MANAGER install -y -q python3
                pip3 install certbot certbot-nginx 2>/dev/null || \
                python3 -m pip install certbot certbot-nginx
            }
        fi

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
        cp -r ./.env.example $INSTALL_DIR/.env 2>/dev/null || cp -r ./.env $INSTALL_DIR/ 2>/dev/null || true
    else
        error "Execute este script a partir do diretório do projeto"
    fi

    cd $INSTALL_DIR

    # Criar .env se não existir
    if [[ ! -f ".env" ]]; then
        cp .env.example .env 2>/dev/null || true
    fi

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
    if [[ -f ".env" ]]; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        # Gerar senha admin aleatória
        ADMIN_PASS=$(openssl rand -base64 12)
        sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASS/" .env
    fi

    log "Painel configurado em: $INSTALL_DIR"
    info "Senha do admin: $ADMIN_PASS"
    info "Salve esta senha em um lugar seguro!"
}

# ============================================
# CONFIGURAÇÃO DO NGINX
# ============================================
setup_nginx() {
    log "Configurando Nginx..."

    # Determinar diretório de configuração
    if [[ -d "/etc/nginx/conf.d" ]]; then
        NGINX_CONF_DIR="/etc/nginx/conf.d"
    elif [[ -d "/etc/nginx/sites-available" ]]; then
        NGINX_CONF_DIR="/etc/nginx/sites-available"
    else
        mkdir -p /etc/nginx/conf.d
        NGINX_CONF_DIR="/etc/nginx/conf.d"
    fi

    cat > ${NGINX_CONF_DIR}/painel-udiaas.conf << 'NGINX'
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

    # Remover configuração default se existir
    rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

    # Testar e reiniciar
    nginx -t && systemctl reload nginx

    log "Nginx configurado"

    # Obter IP público
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "SEU_IP")
    info "Acesse: http://$PUBLIC_IP"
}

# ============================================
# CONFIGURAÇÃO DO FIREWALL
# ============================================
setup_firewall() {
    log "Configurando firewall..."

    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian - UFW
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        log "Firewall UFW configurado"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL - firewalld
        systemctl start firewalld 2>/dev/null || true
        systemctl enable firewalld 2>/dev/null || true
        firewall-cmd --permanent --add-service=ssh 2>/dev/null || true
        firewall-cmd --permanent --add-service=http 2>/dev/null || true
        firewall-cmd --permanent --add-service=https 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
        log "Firewall firewalld configurado"
    else
        warn "Firewall não encontrado. Configure manualmente."
    fi
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
    pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup 2>/dev/null || true

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
            if [[ -d "/etc/nginx/conf.d" ]]; then
                sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/conf.d/painel-udiaas.conf
            fi
            systemctl reload nginx

            # Obter certificado
            certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || \
            certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

            log "SSL configurado para $DOMAIN"
            info "Acesse: https://$DOMAIN"

            # Renovação automática
            (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
            log "Renovação automática de SSL configurada"
        fi
    fi
}

# ============================================
# RESUMO DA INSTALAÇÃO
# ============================================
print_summary() {
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "SEU_IP")
    ADMIN_PASS=$(grep ADMIN_PASSWORD /opt/painel-udiaas/.env 2>/dev/null | cut -d'=' -f2 || echo "veja em /opt/painel-udiaas/.env")

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
    detect_package_manager

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
