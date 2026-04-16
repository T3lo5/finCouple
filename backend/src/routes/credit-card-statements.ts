import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { creditCardStatements, accounts } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

const statementSchema = z.object({
  accountId:     z.string().min(1),
  statementDate: z.string().datetime(),
  dueDate:       z.string().datetime(),
  totalAmount:   z.number(),
  minimumPayment: z.number().optional(),
})

const updateStatementSchema = z.object({
  statementDate: z.string().datetime().optional(),
  dueDate:       z.string().datetime().optional(),
  totalAmount:   z.number().optional(),
  minimumPayment: z.number().optional(),
  paidAmount:    z.number().optional(),
  isPaid:        z.boolean().optional(),
  isClosed:      z.boolean().optional(),
})

router.get('/', async (c) => {
  const user = c.get('user')
  const { accountId, month, year } = c.req.query()

  let conditions: any[] = [eq(creditCardStatements.userId, user.id)]

  if (accountId) {
    conditions.push(eq(creditCardStatements.accountId, accountId))
  }

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0)

    conditions.push(
      and(
        sql`${creditCardStatements.statementDate} >= ${startDate.toISOString()}`,
        sql`${creditCardStatements.statementDate} <= ${endDate.toISOString()}`
      )
    )
  }

  const statements = await db
    .select()
    .from(creditCardStatements)
    .where(and(...conditions))
    .orderBy(creditCardStatements.statementDate)

  return c.json({ data: statements })
})

router.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const statement = await db
    .select()
    .from(creditCardStatements)
    .where(and(eq(creditCardStatements.id, id), eq(creditCardStatements.userId, user.id)))
    .limit(1)

  if (!statement.length) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ data: statement[0] })
})

router.post('/', zValidator('json', statementSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  // Verificar se a conta pertence ao usuário
  const account = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, user.id)))
    .limit(1)

  if (!account.length) {
    return c.json({ error: 'Account not found or does not belong to user' }, 404)
  }

  // Verificar se o tipo da conta é crédito
  if (account[0].type !== 'credit') {
    return c.json({ error: 'Only credit card accounts can have statements' }, 400)
  }

  const [statement] = await db
    .insert(creditCardStatements)
    .values({
      id:           nanoid(),
      accountId:    body.accountId,
      userId:       user.id,
      statementDate: new Date(body.statementDate),
      dueDate:      new Date(body.dueDate),
      totalAmount:  String(body.totalAmount),
      minimumPayment: body.minimumPayment ? String(body.minimumPayment) : null,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    })
    .returning()

  return c.json({ data: statement }, 201)
})

router.patch('/:id', zValidator('json', updateStatementSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const statement = await db
    .select()
    .from(creditCardStatements)
    .where(and(eq(creditCardStatements.id, id), eq(creditCardStatements.userId, user.id)))
    .limit(1)

  if (!statement.length) {
    return c.json({ error: 'Not found' }, 404)
  }

  const [updated] = await db
    .update(creditCardStatements)
    .set({
      ...body.statementDate !== undefined && { statementDate: new Date(body.statementDate) },
      ...body.dueDate !== undefined && { dueDate: new Date(body.dueDate) },
      ...body.totalAmount !== undefined && { totalAmount: String(body.totalAmount) },
      ...body.minimumPayment !== undefined && { minimumPayment: String(body.minimumPayment) },
      ...body.paidAmount !== undefined && { paidAmount: String(body.paidAmount) },
      ...body.isPaid !== undefined && { isPaid: body.isPaid },
      ...body.isClosed !== undefined && { isClosed: body.isClosed },
      updatedAt: new Date(),
    })
    .where(eq(creditCardStatements.id, id))
    .returning()

  return c.json({ data: updated })
})

router.delete('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const statement = await db
    .select()
    .from(creditCardStatements)
    .where(and(eq(creditCardStatements.id, id), eq(creditCardStatements.userId, user.id)))
    .limit(1)

  if (!statement.length) {
    return c.json({ error: 'Not found' }, 404)
  }

  await db.delete(creditCardStatements).where(eq(creditCardStatements.id, id))

  return c.json({ ok: true })
})

// Rota para marcar uma fatura como paga
router.patch('/:id/pay', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const statement = await db
    .select()
    .from(creditCardStatements)
    .where(and(eq(creditCardStatements.id, id), eq(creditCardStatements.userId, user.id)))
    .limit(1)

  if (!statement.length) {
    return c.json({ error: 'Not found' }, 404)
  }

  const [updated] = await db
    .update(creditCardStatements)
    .set({
      isPaid: true,
      paidAmount: statement[0].totalAmount,
      updatedAt: new Date(),
    })
    .where(eq(creditCardStatements.id, id))
    .returning()

  return c.json({ data: updated })
})

export default router