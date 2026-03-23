import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { accounts } from '../db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

const accountSchema = z.object({
  name:        z.string().min(1).max(120),
  institution: z.string().max(100).optional(),
  type:        z.enum(['checking', 'savings', 'credit', 'investment', 'benefit']),
  balance:     z.number().default(0),
  currency:    z.string().length(3).default('BRL'),
  lastFour:    z.string().length(4).optional(),
  context:     z.enum(['individual', 'joint']),
})

router.get('/', async (c) => {
  const user = c.get('user')
  const { context } = c.req.query()

  const conditions = []

  if (context === 'individual') {
    conditions.push(and(eq(accounts.userId, user.id), eq(accounts.context, 'individual')))
  } else if (context === 'joint' && user.coupleId) {
    conditions.push(and(eq(accounts.coupleId, user.coupleId!), eq(accounts.context, 'joint')))
  } else {
    const orConds = [
      and(eq(accounts.userId, user.id), eq(accounts.context, 'individual')),
    ]
    if (user.coupleId) {
      orConds.push(and(eq(accounts.coupleId, user.coupleId!), eq(accounts.context, 'joint')) as any)
    }
    conditions.push(or(...orConds))
  }

  conditions.push(eq(accounts.isActive, true))

  const rows = await db
    .select()
    .from(accounts)
    .where(and(...conditions))

  const totalBalance = rows.reduce((sum, a) => sum + Number(a.balance), 0)

  return c.json({ data: rows, totalBalance })
})

router.post('/', zValidator('json', accountSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'Must be in a couple for joint accounts' }, 400)
  }

  const [account] = await db
    .insert(accounts)
    .values({
      id:          nanoid(),
      userId:      user.id,
      coupleId:    body.context === 'joint' ? user.coupleId : null,
      name:        body.name,
      institution: body.institution,
      type:        body.type,
      balance:     String(body.balance),
      currency:    body.currency,
      lastFour:    body.lastFour,
      context:     body.context,
    })
    .returning()

  return c.json({ data: account }, 201)
})

router.patch('/:id/balance',
  zValidator('json', z.object({ balance: z.number() })),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.param()
    const { balance } = c.req.valid('json')

    const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1)
    if (!account) return c.json({ error: 'Not found' }, 404)
    if (account.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

    const [updated] = await db
      .update(accounts)
      .set({ balance: String(balance), updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning()

    return c.json({ data: updated })
  }
)

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1)
  if (!account) return c.json({ error: 'Not found' }, 404)
  if (account.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  await db.update(accounts).set({ isActive: false, updatedAt: new Date() }).where(eq(accounts.id, id))
  return c.json({ ok: true })
})

export default router
