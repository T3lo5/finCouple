import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { savingsGoals } from '../db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

const goalSchema = z.object({
  title:        z.string().min(1).max(120),
  targetAmount: z.number().positive(),
  context:      z.enum(['individual', 'joint']),
  emoji:        z.string().max(4).optional().default('🎯'),
  deadline:     z.string().datetime().optional(),
})

router.get('/', async (c) => {
  const user = c.get('user')
  const { context } = c.req.query()

  const conditions = []

  if (context === 'individual') {
    conditions.push(and(eq(savingsGoals.userId, user.id), eq(savingsGoals.context, 'individual')))
  } else if (context === 'joint' && user.coupleId) {
    conditions.push(and(eq(savingsGoals.coupleId, user.coupleId), eq(savingsGoals.context, 'joint')))
  } else {
    const orConds = [
      and(eq(savingsGoals.userId, user.id), eq(savingsGoals.context, 'individual')),
    ]
    if (user.coupleId) {
      orConds.push(and(eq(savingsGoals.coupleId, user.coupleId!), eq(savingsGoals.context, 'joint')) as any)
    }
    conditions.push(or(...orConds))
  }

  const goals = await db
    .select()
    .from(savingsGoals)
    .where(and(...conditions))
    .orderBy(savingsGoals.createdAt)

  return c.json({ data: goals })
})

router.post('/', zValidator('json', goalSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'Must be in a couple for joint goals' }, 400)
  }

  const [goal] = await db
    .insert(savingsGoals)
    .values({
      id:           nanoid(),
      userId:       user.id,
      coupleId:     body.context === 'joint' ? user.coupleId : null,
      title:        body.title,
      targetAmount: String(body.targetAmount),
      context:      body.context,
      emoji:        body.emoji,
      deadline:     body.deadline ? new Date(body.deadline) : null,
    })
    .returning()

  return c.json({ data: goal }, 201)
})

router.post('/:id/contribute',
  zValidator('json', z.object({ amount: z.number().positive() })),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.param()
    const { amount } = c.req.valid('json')

    const [goal] = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, id))
      .limit(1)

    if (!goal) return c.json({ error: 'Not found' }, 404)

    const isOwner = goal.userId === user.id
    const isJoint = goal.context === 'joint' && goal.coupleId === user.coupleId
    if (!isOwner && !isJoint) return c.json({ error: 'Forbidden' }, 403)

    const newAmount = Number(goal.currentAmount) + amount
    const isCompleted = newAmount >= Number(goal.targetAmount)

    const [updated] = await db
      .update(savingsGoals)
      .set({
        currentAmount: String(newAmount),
        status: isCompleted ? 'completed' : 'active',
        updatedAt: new Date(),
      })
      .where(eq(savingsGoals.id, id))
      .returning()

    return c.json({ data: updated, completed: isCompleted })
  }
)

router.patch('/:id', zValidator('json', goalSchema.partial()), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1)
  if (!goal) return c.json({ error: 'Not found' }, 404)
  if (goal.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  const [updated] = await db
    .update(savingsGoals)
    .set({
      ...body,
      targetAmount: body.targetAmount ? String(body.targetAmount) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(savingsGoals.id, id))
    .returning()

  return c.json({ data: updated })
})

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1)
  if (!goal) return c.json({ error: 'Not found' }, 404)
  if (goal.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  await db.delete(savingsGoals).where(eq(savingsGoals.id, id))
  return c.json({ ok: true })
})

export default router
