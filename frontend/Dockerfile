FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código-fonte
COPY . .

# Build da aplicação
RUN yarn build

# Servir a aplicação com nginx
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]