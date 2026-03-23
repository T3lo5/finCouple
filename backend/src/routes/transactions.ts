import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { transactions, accounts } from '../db/schema'
import { eq, and, or, desc, gte, lte, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

const createSchema = z.object({
  title: z.string().min(1).max(120),
  amount: z.number(), 
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']),
  context: z.enum(['individual', 'joint']),
  accountId: z.string().optional(),
  notes: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
  isRecurring: z.boolean().optional().default(false),
})

const listQuerySchema = z.object({
  context: z.enum(['individual', 'joint']).optional(),
  category: z.string().optional(),
  from: z.string().optional(), 
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

router.get('/', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user')
  const { context, category, from, to, page, limit } = c.req.valid('query')

  const conditions = []

  if (context === 'individual') {
    conditions.push(and(
      eq(transactions.userId, user.id),
      eq(transactions.context, 'individual')
    ))
  } else if (context === 'joint' && user.coupleId) {
    conditions.push(and(
      eq(transactions.coupleId, user.coupleId),
      eq(transactions.context, 'joint')
    ))
  } else {
    const orConditions = [
      and(eq(transactions.userId, user.id), eq(transactions.context, 'individual')),
    ]
    if (user.coupleId) {
      orConditions.push(
        and(eq(transactions.coupleId, user.coupleId!), eq(transactions.context, 'joint')) as any
      )
    }
    conditions.push(or(...orConditions))
  }

  if (category && category !== 'undefined') {
    conditions.push(eq(transactions.category, category as any))
  }
  if (from) conditions.push(gte(transactions.date, new Date(from)))
  if (to) conditions.push(lte(transactions.date, new Date(to)))

  const offset = (page - 1) * limit

  const [rows, countRow] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(and(...conditions)),
  ])

  return c.json({
    data: rows,
    meta: {
      total: countRow[0].count,
      page,
      limit,
      pages: Math.ceil(countRow[0].count / limit),
    }
  })
})

router.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!tx) return c.json({ error: 'Not found' }, 404)

  const isOwner = tx.userId === user.id
  const isJointMember = tx.context === 'joint' && tx.coupleId === user.coupleId
  if (!isOwner && !isJointMember) return c.json({ error: 'Forbidden' }, 403)

  return c.json({ data: tx })
})

router.post('/', zValidator('json', createSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to create joint transactions' }, 400)
  }

  const [tx] = await db
    .insert(transactions)
    .values({
      id: nanoid(),
      userId: user.id,
      coupleId: body.context === 'joint' ? user.coupleId : null,
      title: body.title,
      amount: String(body.amount),
      type: body.type,
      category: body.category,
      context: body.context,
      accountId: body.accountId,
      notes: body.notes,
      date: body.date ? new Date(body.date) : new Date(),
      isRecurring: body.isRecurring,
    })
    .returning()

  if (body.accountId) {
    await db
      .update(accounts)
      .set({
        balance: sql`${accounts.balance} + ${body.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, body.accountId))
  }

  return c.json({ data: tx }, 201)
})

router.patch('/:id',
  zValidator('json', createSchema.partial()),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.param()
    const body = c.req.valid('json')

    const [existing] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (existing.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

    const updateData: Record<string, any> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.amount !== undefined) updateData.amount = String(body.amount)
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.context !== undefined) updateData.context = body.context
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.date !== undefined) updateData.date = new Date(body.date)

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning()

    return c.json({ data: updated })
  }
)

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [existing] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  await db.delete(transactions).where(eq(transactions.id, id))

  return c.json({ ok: true })
})

router.get('/summary/monthly', async (c) => {
  const user = c.get('user')
  const { context } = c.req.query()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const conditions = []

  if (context === 'joint' && user.coupleId) {
    conditions.push(
      and(
        eq(transactions.coupleId, user.coupleId),
        eq(transactions.context, 'joint')
      )
    )
  } else {
    conditions.push(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.context, 'individual')
      )
    )
  }

  conditions.push(gte(transactions.date, startOfMonth))
  conditions.push(lte(transactions.date, endOfMonth))

  const rows = await db
    .select({
      category: transactions.category,
      type: transactions.type,
      total: sql<number>`sum(${transactions.amount}::numeric)`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.category, transactions.type)

  const income = rows
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.total), 0)

  const expenses = rows
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Math.abs(Number(r.total)), 0)

  return c.json({
    income,
    expenses,
    balance: income - expenses,
    byCategory: rows,
  })
})

export default router
