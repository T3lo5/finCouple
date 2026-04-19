FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Instalar dependências
RUN npm install --legacy-peer-deps --production=false

# Copiar código-fonte
COPY src/ ./src/
COPY drizzle/ ./drizzle/
COPY drizzle.config.ts ./

# Expor porta
EXPOSE 3000

# Rodar a aplicação
CMD ["npm", "run", "dev"]
