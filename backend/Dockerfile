FROM oven/bun:latest

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json bun.lockx ./
COPY tsconfig.json ./

# Instalar dependências
RUN bun install

# Copiar código-fonte
COPY src/ ./src/
COPY drizzle/ ./drizzle/
COPY drizzle.config.ts ./

# Expor porta
EXPOSE 3000

# Rodar a aplicação
CMD ["bun", "run", "dev"]