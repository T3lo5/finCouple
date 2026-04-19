FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm install

# Copiar código-fonte
COPY . .

# Build da aplicação
RUN npm run build

# Servir a aplicação com nginx
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]