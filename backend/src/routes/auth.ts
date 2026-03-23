import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { users, sessions, couples } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireAuth } from '../middleware/auth'

const auth = new Hono()

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.PASSWORD_SALT)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('hex')
}

function createSessionToken(): string {
  return nanoid(64)
}

auth.post('/register',
  zValidator('json', z.object({
    email:    z.string().email(),
    name:     z.string().min(2).max(80),
    password: z.string().min(8),
  })),
  async (c) => {
    const { email, name, password } = c.req.valid('json')

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existing) {
      return c.json({ error: 'Email already registered' }, 409)
    }

    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({ email: email.toLowerCase(), name, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email })

    const token = createSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 

    await db.insert(sessions).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
    })

    c.header('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)

    return c.json({ user, token }, 201)
  }
)

auth.post('/login',
  zValidator('json', z.object({
    email:    z.string().email(),
    password: z.string(),
  })),
  async (c) => {
    const { email, password } = c.req.valid('json')

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = createSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.insert(sessions).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
    })

    c.header('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)

    return c.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, coupleId: user.coupleId }
    })
  }
)

auth.post('/logout', requireAuth, async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token))
  }
  c.header('Set-Cookie', 'session_token=; HttpOnly; Path=/; Max-Age=0')
  return c.json({ ok: true })
})

auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

auth.post('/couple/create', requireAuth, async (c) => {
  const user = c.get('user')

  if (user.coupleId) {
    return c.json({ error: 'Already in a couple' }, 409)
  }

  const inviteCode = nanoid(10)

  const [couple] = await db
    .insert(couples)
    .values({ inviteCode })
    .returning()

  await db
    .update(users)
    .set({ coupleId: couple.id, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return c.json({ couple })
})

auth.post('/couple/join',
  requireAuth,
  zValidator('json', z.object({ inviteCode: z.string() })),
  async (c) => {
    const user = c.get('user')
    const { inviteCode } = c.req.valid('json')

    if (user.coupleId) {
      return c.json({ error: 'Already in a couple' }, 409)
    }

    const [couple] = await db
      .select()
      .from(couples)
      .where(eq(couples.inviteCode, inviteCode))
      .limit(1)

    if (!couple) {
      return c.json({ error: 'Invalid invite code' }, 404)
    }

    const members = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.coupleId, couple.id))

    if (members.length >= 2) {
      return c.json({ error: 'Couple is full' }, 409)
    }

    await db
      .update(users)
      .set({ coupleId: couple.id, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return c.json({ couple })
  }
)

export default auth
