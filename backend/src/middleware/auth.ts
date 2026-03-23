import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { sessions, users } from '../db/schema'
import { eq, and, gt } from 'drizzle-orm'

export type AuthUser = {
  id: string
  email: string
  name: string
  coupleId: string | null
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const token =
    c.req.header('Authorization')?.replace('Bearer ', '') ||
    getCookie(c.req.raw, 'session_token')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [session] = await db
    .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, coupleId: users.coupleId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) {
    return c.json({ error: 'User not found' }, 401)
  }

  c.set('user', user)
  await next()
})

function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return undefined
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const cookie = cookies.find(c => c.startsWith(`${name}=`))
  return cookie?.split('=')[1]
}
