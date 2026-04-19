import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { installmentPurchases, accounts } from '../db/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

const installmentSchema = z.object({
  title:             z.string().min(1).max(120),
  totalAmount:       z.number().positive(),
  installmentCount:  z.number().int().min(1).max(120),
  installmentAmount: z.number().positive(),
  startDate:         z.string().datetime(),
  nextDueDate:       z.string().datetime(),
  category:          z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']).default('shopping'),
  context:           z.enum(['individual', 'joint']),
  accountId:         z.string().optional(),
  notes:             z.string().optional(),
})

const updateInstallmentSchema = z.object({
  title:             z.string().min(1).max(120).optional(),
  totalAmount:       z.number().positive().optional(),
  installmentCount:  z.number().int().min(1).max(120).optional(),
  installmentAmount: z.number().positive().optional(),
  startDate:         z.string().datetime().optional(),
  nextDueDate:       z.string().datetime().optional(),
  category:          z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']).optional(),
  context:           z.enum(['individual', 'joint']).optional(),
  accountId:         z.string().nullable().optional(),
  notes:             z.string().nullable().optional(),
  isActive:          z.boolean().optional(),
})

// GET /api/installments - Listar compras parceladas
router.get('/', async (c) => {
  const user = c.get('user')
  const { context, isActive } = c.req.query()

  const conditions = []

  if (context === 'individual') {
    conditions.push(and(eq(installmentPurchases.userId, user.id), eq(installmentPurchases.context, 'individual')))
  } else if (context === 'joint' && user.coupleId) {
    conditions.push(and(eq(installmentPurchases.coupleId, user.coupleId!), eq(installmentPurchases.context, 'joint')))
  } else {
    const orConds = [
      and(eq(installmentPurchases.userId, user.id), eq(installmentPurchases.context, 'individual')),
    ]
    if (user.coupleId) {
      orConds.push(and(eq(installmentPurchases.coupleId, user.coupleId!), eq(installmentPurchases.context, 'joint')) as any)
    }
    conditions.push(or(...orConds))
  }

  if (isActive !== undefined) {
    conditions.push(eq(installmentPurchases.isActive, isActive === 'true'))
  }

  const rows = await db
    .select()
    .from(installmentPurchases)
    .where(and(...conditions))
    .orderBy(desc(installmentPurchases.createdAt))

  return c.json({ data: rows })
})

// GET /api/installments/:id - Obter detalhes
router.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [installment] = await db
    .select()
    .from(installmentPurchases)
    .where(and(eq(installmentPurchases.id, id), eq(installmentPurchases.userId, user.id)))
    .limit(1)

  if (!installment) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ data: installment })
})

// POST /api/installments - Criar nova compra parcelada
router.post('/', zValidator('json', installmentSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'Must be in a couple for joint installments' }, 400)
  }

  // Verificar se a conta pertence ao usuário (se fornecida)
  if (body.accountId) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, user.id)))
      .limit(1)

    if (!account) {
      return c.json({ error: 'Account not found or does not belong to user' }, 404)
    }
  }

  const [installment] = await db
    .insert(installmentPurchases)
    .values({
      id:                nanoid(),
      userId:            user.id,
      coupleId:          body.context === 'joint' ? user.coupleId : null,
      title:             body.title,
      totalAmount:       String(body.totalAmount),
      installmentCount:  body.installmentCount,
      currentInstallment: 1,
      installmentAmount: String(body.installmentAmount),
      startDate:         new Date(body.startDate),
      nextDueDate:       new Date(body.nextDueDate),
      category:          body.category,
      context:           body.context,
      accountId:         body.accountId || null,
      notes:             body.notes || null,
    })
    .returning()

  return c.json({ data: installment }, 201)
})

// PATCH /api/installments/:id - Atualizar compra parcelada
router.patch('/:id', zValidator('json', updateInstallmentSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const [existing] = await db
    .select()
    .from(installmentPurchases)
    .where(eq(installmentPurchases.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  // Verificar propriedade
  if (existing.userId !== user.id && !(existing.coupleId && existing.coupleId === user.coupleId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const updateData: Record<string, any> = { updatedAt: new Date() }

  if (body.title !== undefined) updateData.title = body.title
  if (body.totalAmount !== undefined) updateData.totalAmount = String(body.totalAmount)
  if (body.installmentCount !== undefined) updateData.installmentCount = body.installmentCount
  if (body.installmentAmount !== undefined) updateData.installmentAmount = String(body.installmentAmount)
  if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
  if (body.nextDueDate !== undefined) updateData.nextDueDate = new Date(body.nextDueDate)
  if (body.category !== undefined) updateData.category = body.category
  if (body.context !== undefined) updateData.context = body.context
  if (body.accountId !== undefined) updateData.accountId = body.accountId
  if (body.notes !== undefined) updateData.notes = body.notes
  if (body.isActive !== undefined) updateData.isActive = body.isActive

  const [updated] = await db
    .update(installmentPurchases)
    .set(updateData)
    .where(eq(installmentPurchases.id, id))
    .returning()

  return c.json({ data: updated })
})

// PATCH /api/installments/:id/advance - Avançar para próxima parcela
router.patch('/:id/advance', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [existing] = await db
    .select()
    .from(installmentPurchases)
    .where(eq(installmentPurchases.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  // Verificar propriedade
  if (existing.userId !== user.id && !(existing.coupleId && existing.coupleId === user.coupleId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Verificar se já está na última parcela
  if (existing.currentInstallment >= existing.installmentCount) {
    return c.json({ error: 'Already at last installment' }, 400)
  }

  const nextInstallment = existing.currentInstallment + 1
  const isNowComplete = nextInstallment >= existing.installmentCount

  // Calcular próxima data de vencimento (adicionar 1 mês)
  const nextDueDate = new Date(existing.nextDueDate)
  nextDueDate.setMonth(nextDueDate.getMonth() + 1)

  const [updated] = await db
    .update(installmentPurchases)
    .set({
      currentInstallment: nextInstallment,
      nextDueDate,
      isActive: !isNowComplete,
      updatedAt: new Date(),
    })
    .where(eq(installmentPurchases.id, id))
    .returning()

  return c.json({ data: updated, completed: isNowComplete })
})

// PATCH /api/installments/:id/toggle-active - Ativar/desativar
router.patch('/:id/toggle-active', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [existing] = await db
    .select()
    .from(installmentPurchases)
    .where(eq(installmentPurchases.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  // Verificar propriedade
  if (existing.userId !== user.id && !(existing.coupleId && existing.coupleId === user.coupleId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const [updated] = await db
    .update(installmentPurchases)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(installmentPurchases.id, id))
    .returning()

  return c.json({ data: updated })
})

// DELETE /api/installments/:id - Excluir compra parcelada
router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [existing] = await db
    .select()
    .from(installmentPurchases)
    .where(eq(installmentPurchases.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  // Verificar propriedade
  if (existing.userId !== user.id && !(existing.coupleId && existing.coupleId === user.coupleId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await db.delete(installmentPurchases).where(eq(installmentPurchases.id, id))

  return c.json({ ok: true })
})

export default router