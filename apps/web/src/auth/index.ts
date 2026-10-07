import * as authSchema from '@templateMonorepo/api/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { v7 as uuidv7 } from 'uuid'

import { envServer } from '@/lib/env-server'
import { sendEmail } from '@/lib/mail'
import {
  passwordChangedTemplate,
  passwordChangedTextTemplate,
  resetPasswordTemplate,
  resetPasswordTextTemplate,
  verifyEmailTemplate,
  verifyEmailTextTemplate,
} from '@/lib/mail-templates'

// Esta é a instância "fonte da verdade" do better-auth: emite sessão, cuida de
// cadastro/login/logout, reset de senha (com envio de e-mail) e rate limit.
// A API (apps/api/src/auth/index.ts) tem uma segunda instância, mais enxuta,
// só pra validar a sessão emitida aqui (mesmo banco + mesmo
// BETTER_AUTH_SECRET) — por isso rateLimit, emailAndPassword e hooks só
// precisam estar configurados neste lado.

declare global {
  var _pgPool: Pool | undefined
}

// ponytail: globalThis guard prevents HMR from leaking pg.Pool instances (each holds 10 idle connections)
const pool = (globalThis._pgPool ??= new Pool({
  connectionString: envServer.DATABASE_URL,
}))

// O schema é o mesmo das migrations (apps/api), que criaram as colunas em
// camelCase ("emailVerified", "createdAt"...) — sem o casing, toda consulta
// falha com "column does not exist".
const db = drizzle(pool, { schema: authSchema, casing: 'camelCase' })

const auth = betterAuth({
  secret: envServer.BETTER_AUTH_SECRET,
  baseURL: envServer.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: 'pg' }),
  session: {
    expiresIn: 60 * 60 * 4,
    updateAge: 60 * 5,
  },
  // É esta instância que cria usuário/sessão/conta, então o formato do ID vive aqui
  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Sem isso, requireEmailVerification só bloqueia um NOVO login — a sessão
    // criada no próprio cadastro continuava valendo pra quem nunca verificou.
    autoSignIn: false,
    resetPasswordTokenExpiresIn: 3600,
    // `url` já é o link de verificação do better-auth
    // (/reset-password/:token?callbackURL=...) — ele confere o token e
    // redireciona pra a página de destino (ver `redirectTo` em
    // authClient.requestPasswordReset, em esqueci-a-senha/page.tsx) com
    // ?token=... anexado. Não precisa (e não deve) ser reescrito aqui.
    // Sem await de propósito: responder no mesmo tempo exista ou não a conta.
    sendResetPassword: async ({ user, url }) => {
      const data = { userName: user.name, resetUrl: url, expiresIn: '1 hora' }
      sendEmail({
        to: user.email,
        subject: 'Redefinição de Senha - Template Monorepo Authenticate',
        html: resetPasswordTemplate(data),
        text: resetPasswordTextTemplate(data),
      })
    },
    onPasswordReset: async ({ user }) => {
      sendEmail({
        to: user.email,
        subject: 'Senha Alterada - Template Monorepo Authenticate',
        html: passwordChangedTemplate({ userName: user.name }),
        text: passwordChangedTextTemplate({ userName: user.name }),
      })
    },
  },

  socialProviders: {
    google: {
      clientId: envServer.GOOGLE_CLIENT_ID,
      clientSecret: envServer.GOOGLE_CLIENT_SECRET,
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const data = { userName: user.name, verificationUrl: url }
      sendEmail({
        to: user.email,
        subject: 'Confirme seu e-mail - Template Monorepo Authenticate',
        html: verifyEmailTemplate(data),
        text: verifyEmailTextTemplate(data),
      })
    },
  },

  // ponytail: storage em memória — não é compartilhado entre instâncias; use 'database' ao escalar horizontalmente
  rateLimit: {
    enabled: true,
    storage: 'memory',
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 5 },
      '/request-password-reset': { window: 60, max: 5 },
      '/send-verification-email': { window: 60, max: 5 },
    },
  },

  user: {
    // Todas as tabelas do usuário usam onDelete: 'cascade' pro user.id —
    // apagar a conta já apaga o resto.
    deleteUser: { enabled: true },
  },
})

export { auth }
