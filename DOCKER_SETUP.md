# Docker Compose para FinCouple

Este projeto contém vários arquivos docker-compose para diferentes cenários de desenvolvimento e produção.

## Arquivos Disponíveis

1. `docker-compose.db.yml` - Somente banco de dados PostgreSQL com execução de migrations
2. `docker-compose.backend.yml` - Backend com banco de dados PostgreSQL
3. `docker-compose.frontend.yml` - Frontend com backend e banco de dados
4. `docker-compose.yml` - Ambiente completo (frontend, backend e banco de dados)

## Como Usar

### 1. Somente Banco de Dados

Para subir apenas o banco de dados PostgreSQL com as migrations:

```bash
docker-compose -f docker-compose.db.yml up -d
```

### 2. Backend com Banco de Dados

Para subir o backend com o banco de dados:

```bash
docker-compose -f docker-compose.backend.yml up -d
```

### 3. Frontend com Backend e Banco de Dados

Para subir o frontend com todas as dependências:

```bash
docker-compose -f docker-compose.frontend.yml up -d
```

### 4. Ambiente Completo

Para subir todo o ambiente (frontend, backend e banco de dados):

```bash
docker-compose up -d
```

## Comandos Úteis

### Parar containers

```bash
# Para o ambiente específico
docker-compose -f docker-compose.[tipo].yml down

# Para o ambiente completo
docker-compose down
```

### Ver logs

```bash
# Para o ambiente específico
docker-compose -f docker-compose.[tipo].yml logs -f

# Para o ambiente completo
docker-compose logs -f
```

### Executar migrations manualmente

Se as migrations não forem executadas automaticamente, você pode executá-las manualmente:

```bash
# Entrar no container do backend
docker-compose -f docker-compose.backend.yml exec backend sh

# Dentro do container, executar as migrations
bun run db:migrate
```

## Considerações

- As migrations são executadas automaticamente quando os containers são iniciados
- Certifique-se de que os arquivos Dockerfile necessários estejam presentes nos diretórios backend e frontend
- O banco de dados PostgreSQL é mantido em um volume persistente para manter os dados entre reinicializações