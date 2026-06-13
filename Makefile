.PHONY: install dev build start stop restart logs ssl clean

# Cores
GREEN = \033[0;32m
CYAN = \033[0;36m
NC = \033[0m

# ============================================
# COMANDOS PRINCIPAIS
# ============================================

install:
	@echo -e "$(GREEN)🚀 Instalando Painel udiaas...$(NC)"
	npm install
	cd client && npm install && npm run build
	@echo -e "$(GREEN)✅ Instalação concluída!$(NC)"
	@echo -e "$(CYAN)Execute: npm start$(NC)"

dev:
	@echo -e "$(GREEN)🔧 Iniciando em modo desenvolvimento...$(NC)"
	npm run dev

build:
	@echo -e "$(GREEN)📦 Buildando frontend...$(NC)"
	cd client && npm run build
	@echo -e "$(GREEN)✅ Build concluído!$(NC)"

start:
	@echo -e "$(GREEN)🚀 Iniciando Painel udiaas...$(NC)"
	pm2 start server/index.js --name painel-udiaas
	@echo -e "$(GREEN)✅ Painel iniciado!$(NC)"

stop:
	@echo -e "$(GREEN)⏹️  Parando Painel udiaas...$(NC)"
	pm2 stop painel-udiaas

restart:
	@echo -e "$(GREEN)🔄 Reiniciando Painel udiaas...$(NC)"
	pm2 restart painel-udiaas

logs:
	pm2 logs painel-udiaas --lines 100

status:
	pm2 status

# ============================================
# DOCKER
# ============================================

docker-build:
	@echo -e "$(GREEN)🐳 Buildando imagem Docker...$(NC)"
	docker-compose build

docker-up:
	@echo -e "$(GREEN)🐳 Subindo containers...$(NC)"
	docker-compose up -d

docker-down:
	@echo -e "$(GREEN)🐳 Parando containers...$(NC)"
	docker-compose down

docker-logs:
	docker-compose logs -f

# ============================================
# SSL
# ============================================

ssl:
	@echo -e "$(GREEN)🔒 Configurando SSL...$(NC)"
	@read -p "Domínio: " domain; \
	certbot --nginx -d $$domain --non-interactive --agree-tos --email admin@$$domain

ssl-renew:
	sudo certbot renew

# ============================================
# MANUTENÇÃO
# ============================================

update:
	@echo -e "$(GREEN)⬆️  Atualizando Painel udiaas...$(NC)"
	git pull
	npm install
	cd client && npm install && npm run build
	pm2 restart painel-udiaas
	@echo -e "$(GREEN)✅ Atualização concluída!$(NC)"

clean:
	@echo -e "$(GREEN)🧹 Limpando arquivos temporários...$(NC)"
	rm -rf node_modules/.cache
	rm -rf client/node_modules/.cache
	rm -rf client/dist
	@echo -e "$(GREEN)✅ Limpeza concluída!$(NC)"

backup:
	@echo -e "$(GREEN)💾 Criando backup...$(NC)"
	tar -czf backup-$$(date +%Y%m%d-%H%M%S).tar.gz data/ .env
	@echo -e "$(GREEN)✅ Backup criado!$(NC)"

# ============================================
# HELP
# ============================================

help:
	@echo ""
	@echo -e "$(CYAN)🚀 Painel udiaas - Comandos Disponíveis$(NC)"
	@echo ""
	@echo "  make install      - Instalar dependências"
	@echo "  make dev          - Iniciar em modo dev"
	@echo "  make build        - Buildar frontend"
	@echo "  make start        - Iniciar com PM2"
	@echo "  make stop         - Parar painel"
	@echo "  make restart      - Reiniciar painel"
	@echo "  make logs         - Ver logs"
	@echo "  make status       - Status do painel"
	@echo ""
	@echo "  make docker-build - Buildar Docker"
	@echo "  make docker-up    - Subir Docker"
	@echo "  make docker-down  - Parar Docker"
	@echo ""
	@echo "  make ssl          - Configurar SSL"
	@echo "  make ssl-renew    - Renovar SSL"
	@echo ""
	@echo "  make update       - Atualizar painel"
	@echo "  make backup       - Criar backup"
	@echo "  make clean        - Limpar cache"
	@echo ""
