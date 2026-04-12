import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { recurringBills } from '../db/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

const recurringBillSchema = z.object({
  title:       z.string().min(1).max(120),
  amount:      z.number().positive(),
  category:    z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']).default('bills'),
  context:     z.enum(['individual', 'joint']),
  frequency:   z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  nextDueDate: z.string().optional(),
  autoPay:     z.boolean().default(false),
})

router.get('/', async (c) => {
  const user = c.get('user')
  const { context, isActive } = c.req.query()

  const conditions = []

  if (context === 'individual') {
    conditions.push(and(eq(recurringBills.userId, user.id), eq(recurringBills.context, 'individual')))
  } else if (context === 'joint' && user.coupleId) {
    conditions.push(and(eq(recurringBills.coupleId, user.coupleId!), eq(recurringBills.context, 'joint')))
  } else {
    const orConds = [
      and(eq(recurringBills.userId, user.id), eq(recurringBills.context, 'individual')),
    ]
    if (user.coupleId) {
      orConds.push(and(eq(recurringBills.coupleId, user.coupleId!), eq(recurringBills.context, 'joint')) as any)
    }
    conditions.push(or(...orConds))
  }

  if (isActive !== undefined) {
    conditions.push(eq(recurringBills.isActive, isActive === 'true'))
  }

  const rows = await db
    .select()
    .from(recurringBills)
    .where(and(...conditions))
    .orderBy(desc(recurringBills.createdAt))

  return c.json({ data: rows })
})

router.post('/', zValidator('json', recurringBillSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'Must be in a couple for joint bills' }, 400)
  }

  const [bill] = await db
    .insert(recurringBills)
    .values({
      id:          nanoid(),
      userId:      user.id,
      coupleId:    body.context === 'joint' ? user.coupleId : null,
      title:       body.title,
      amount:      String(body.amount),
      category:    body.category,
      context:     body.context,
      frequency:   body.frequency,
      nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : new Date(),
      autoPay:     body.autoPay,
    })
    .returning()

  return c.json({ data: bill }, 201)
})

router.patch('/:id', zValidator('json', recurringBillSchema.partial()), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const [bill] = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).limit(1)
  if (!bill) return c.json({ error: 'Not found' }, 404)
  if (bill.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  const updateData: Record<string, any> = { updatedAt: new Date() }
  
  if (body.title !== undefined) updateData.title = body.title
  if (body.amount !== undefined) updateData.amount = String(body.amount)
  if (body.category !== undefined) updateData.category = body.category
  if (body.context !== undefined) updateData.context = body.context
  if (body.frequency !== undefined) updateData.frequency = body.frequency
  if (body.nextDueDate !== undefined) updateData.nextDueDate = new Date(body.nextDueDate)
  if (body.autoPay !== undefined) updateData.autoPay = body.autoPay

  const [updated] = await db
    .update(recurringBills)
    .set(updateData)
    .where(eq(recurringBills.id, id))
    .returning()

  return c.json({ data: updated })
})

router.patch('/:id/toggle-active', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [bill] = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).limit(1)
  if (!bill) return c.json({ error: 'Not found' }, 404)
  if (bill.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  const [updated] = await db
    .update(recurringBills)
    .set({ isActive: !bill.isActive, updatedAt: new Date() })
    .where(eq(recurringBills.id, id))
    .returning()

  return c.json({ data: updated })
})

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [bill] = await db.select().from(recurringBills).where(eq(recurringBills.id, id)).limit(1)
  if (!bill) return c.json({ error: 'Not found' }, 404)
  if (bill.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  await db.delete(recurringBills).where(eq(recurringBills.id, id))
  return c.json({ ok: true })
})

export default router
