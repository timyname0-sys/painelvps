FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    bash \
    git \
    python3 \
    make \
    g++

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json primeiro (cache de layers)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copiar código do servidor
COPY server/ ./server/
COPY .env ./

# Copiar e buildar o frontend
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Criar diretórios de dados
RUN mkdir -p data/sites data/files

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/auth/verify || exit 1

# Iniciar aplicação
CMD ["node", "server/index.js"]
