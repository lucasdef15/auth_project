1. start the node typescript + express project

- beforehand make the file structure
- npm init -y
- npm i -D typescript @types/node
- iniside package json file change: "type": "module"
- npm i express jsonwebtoken bcryptjs dotenv
- npm i -D @types/express @types/jsonwebtoken @types/bcryptjs
- Gere o arquivo de configuração do TypeScript: npm i -D tsx / npx tsc --init

> Para configurar corretamente o `tsconfig.json` para Node.js, use como referência: [https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping](https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping)

> No `package.json`, adicione o script:

```json
"scripts": {
  "dev": "tsx watch src/http/server.ts"
}
```

> No `tsconfig.json`, garanta que os tipos do Node estejam habilitados:

```json
"types": ["node"]
```

## 5. Conectando a aplicação ao banco de dados

Instale a biblioteca de conexão com PostgreSQL:

```bash
npm i pg
npm i -D @types/pg
```

Após estruturar os arquivos principais do projeto:

- `routes`
- `app.ts`
- `server.ts`
- `db/index.ts`

Conecte a aplicação ao banco usando o `pg`.

6. configurando o docker para uso

- make the docker-compose.yml
- atentar o nome do volume tem que ser diferente toda vez
- docker compose up -d
- docker ps
- docker exec -it auth_postgres psql -U postgres -d auth_db
- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
role TEXT DEFAULT 'user',
refresh_token TEXT,
created_at TIMESTAMP DEFAULT now()
);

- \d users
