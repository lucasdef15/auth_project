# Guia de Inicialização — Node.js + TypeScript + Express + PostgreSQL + Docker

## 1. Start the Node.js + TypeScript + Express project

### Preparação inicial

- Criar previamente a estrutura de pastas do projeto (ex: `src/`, `src/http/`, `src/db/`)
- Inicializar o projeto Node:

```bash
npm init -y
```

### TypeScript base

- Instalar TypeScript e tipos do Node:

```bash
npm i -D typescript @types/node
```

- No `package.json`, alterar:

```json
"type": "module"
```

---

### Dependências principais da aplicação

- Instalar bibliotecas base:

```bash
npm i express jsonwebtoken bcryptjs dotenv
```

- Instalar tipagens:

```bash
npm i -D @types/express @types/jsonwebtoken @types/bcryptjs
```

---

### Configuração do TypeScript

- Instalar o `tsx`:

```bash
npm i -D tsx
```

- Gerar o arquivo de configuração:

```bash
npx tsc --init
```

> Referência oficial para Node Target Mapping:
> https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping

---

### Scripts do projeto

- Adicionar no `package.json`:

```json
"scripts": {
  "dev": "tsx watch src/http/server.ts"
}
```

---

### Ajustes importantes no `tsconfig.json`

- Garantir os tipos do Node:

```json
"types": ["node"]
```

---

## 5. Conectando a aplicação ao banco de dados (PostgreSQL)

### Instalação do driver

```bash
npm i pg
npm i -D @types/pg
```

### Estrutura mínima

Arquivos principais:

- `routes/`
- `app.ts`
- `server.ts`
- `db/index.ts`

Conectar a aplicação ao banco usando `pg` no `db/index.ts`.

---

## 6. Configurando o Docker para uso

### Docker Compose

- Criar `docker-compose.yml`
- Garantir nome de volume único
- Subir containers:

```bash
docker compose up -d
```

- Conferir:

```bash
docker ps
```

---

### Acesso ao PostgreSQL no container

```bash
docker exec -it auth_postgres psql -U postgres -d auth_db
```

---

### Preparação do banco

- Habilitar extensão:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

- Criar tabela:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

- Conferir:

```sql
\d users
```

---

## Observações importantes

- `.env` não deve ser commitado
- `docker-compose.yml` deve ser commitado
- `.env.example` é recomendado

## Fluxo de Autenticação

![Fluxograma de autenticação](docs/images/fluxo-auth.png)
