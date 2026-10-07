# Template Monorepo Authenticate

Template de monorepo com autenticação pronta usando [Better Auth](https://www.better-auth.com): front-end em Next.js e API em Fastify, compartilhando o mesmo banco PostgreSQL e a mesma sessão.

## Stack

| Camada   | Tecnologias                                                                       |
| -------- | --------------------------------------------------------------------------------- |
| Web      | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (Radix), React Hook Form, Zod     |
| API      | Fastify 5, Zod (`fastify-type-provider-zod`), Helmet, CORS, Rate Limit            |
| Auth     | Better Auth (e-mail/senha com verificação, reset de senha, Google OAuth)          |
| Banco    | PostgreSQL 17 (Docker), Drizzle ORM + Drizzle Kit                                 |
| Tooling  | pnpm workspaces, TypeScript, ESLint, Prettier                                     |

## Estrutura

```
apps/
├── api/                      # @templateMonorepo/api — Fastify (porta 3333)
│   ├── compose.yml           # PostgreSQL
│   └── src/
│       ├── auth/             # Better Auth "somente leitura" (valida sessão)
│       ├── database/
│       │   ├── schema/       # Schema Drizzle — fonte única, também usado pelo web
│       │   └── migrations/
│       ├── http/
│       │   ├── middlewares/  # authenticate (preHandler para rotas protegidas)
│       │   ├── routes/
│       │   └── server.ts
│       └── lib/env.ts
└── web/                      # @templateMonorepo/web — Next.js (porta 3000)
    └── src/
        ├── app/
        │   ├── (public)/     # sign-in, sign-up, esqueci-a-senha, redefinir-senha
        │   ├── (private)/    # área logada (sidebar + topbar)
        │   └── api/[...all]/ # rotas do Better Auth em /api/auth/*
        ├── auth/             # Better Auth "fonte da verdade" + client
        ├── components/ui/    # componentes shadcn/ui
        ├── lib/              # env, e-mail (nodemailer) e templates
        └── proxy.ts          # proteção de rotas (redireciona sem sessão)
```

## Como a autenticação funciona

Existem **duas instâncias** do Better Auth apontando para o **mesmo banco** e o **mesmo `BETTER_AUTH_SECRET`**:

- **Web** (`apps/web/src/auth`): fonte da verdade. Cadastra, faz login/logout, envia e-mails (verificação e reset de senha), aplica rate limit e cria os registros (IDs em UUIDv7).
- **API** (`apps/api/src/auth`): só valida a sessão. Rotas protegidas usam o `preHandler: authenticate`, que lê o cookie emitido pelo web e preenche `request.user` / `request.session`.

O schema do banco vive em `apps/api/src/database/schema` e é importado pelo web via `@templateMonorepo/api/schema`, evitando divergência entre as duas apps.

## Pré-requisitos

- Node.js 24+
- pnpm 11+
- Docker (para o PostgreSQL)

## Configuração

1. **Instale as dependências**

   ```bash
   pnpm install
   ```

2. **Crie os arquivos de ambiente** a partir dos exemplos:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. **Gere o segredo do Better Auth** e use o **mesmo valor** em `BETTER_AUTH_SECRET` nos dois `.env`:

   ```bash
   openssl rand -base64 32
   ```

4. **Preencha o SMTP** em `apps/web/.env` (`SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`). Com Gmail, use uma [senha de app](https://myaccount.google.com/apppasswords).

5. **Configure o Google OAuth** em `apps/web/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), cadastre a URI de redirecionamento:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. **Suba o banco e rode as migrations**

   ```bash
   docker compose -f apps/api/compose.yml --env-file apps/api/.env up -d
   ```

   ```bash
   pnpm --dir apps/api db:migrate
   ```

## Desenvolvimento

Em terminais separados:

```bash
pnpm --dir apps/api dev
```

```bash
pnpm --dir apps/web dev
```

- Web: http://localhost:3000
- API: http://localhost:3333

## Scripts

| Script              | API | Web | Descrição                                   |
| ------------------- | :-: | :-: | ------------------------------------------- |
| `dev`               |  ✓  |  ✓  | Ambiente de desenvolvimento                 |
| `build`             |  ✓  |  ✓  | Build de produção                           |
| `start`             |  ✓  |  ✓  | Sobe o build de produção                    |
| `lint` / `lint:fix` |  ✓  |  ✓  | ESLint                                      |
| `format`            |  ✓  |  ✓  | Prettier                                    |
| `db:generate`       |  ✓  |     | Gera migration a partir do schema           |
| `db:migrate`        |  ✓  |     | Aplica as migrations                        |
| `db:studio`         |  ✓  |     | Abre o Drizzle Studio                       |

Rode com `pnpm --dir apps/<app> <script>`.

## Criando uma rota protegida na API

```ts
import type { FastifyInstance } from 'fastify'

import { authenticate } from '@/http/middlewares/auth'

export async function me(app: FastifyInstance) {
  app.get('/me', { preHandler: authenticate }, async (request) => {
    return { user: request.user }
  })
}
```

Registre a rota em `apps/api/src/http/server.ts` com `app.register(me)`. No front, chame a API com `credentials: 'include'` para enviar o cookie de sessão.

## Componentes de UI

Os componentes ficam em `apps/web/src/components/ui` e devem ser adicionados pela CLI oficial do shadcn, não escritos à mão:

```bash
pnpm --dir apps/web dlx shadcn@latest add <componente>
```

Depois de adicionar, confira se a CLI não incluiu dependências inesperadas no `package.json` e se os imports usam os aliases do `components.json` (`@/lib/utils`, `@/components/ui`).

## Segurança

- Verificação de e-mail obrigatória antes do primeiro login.
- Rate limit no Better Auth (login, cadastro, reset de senha, reenvio de verificação) e global na API (200 req/min por IP).
- Sessão de 4 horas, renovada a cada 5 minutos de uso.
- Headers de segurança na API via Helmet; CORS restrito a `FRONTEND_URL`.
- Nomes de usuário escapados nos templates de e-mail.
- PostgreSQL exposto apenas em `127.0.0.1`.

> O rate limit do Better Auth usa armazenamento em memória. Ao rodar mais de uma instância do web, troque para `storage: 'database'`.
