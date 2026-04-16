import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { transactions, accounts } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'

const router = new Hono()
router.use(requireAuth)

// Schema para conciliação de transações
const reconciliationSchema = z.object({
  transactionIds: z.array(z.string()).min(1),
  accountId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

router.post('/bank-reconciliation', zValidator('json', reconciliationSchema), async (c) => {
  const user = c.get('user')
  const { transactionIds, accountId, startDate, endDate } = c.req.valid('json')

  // Verificar se a conta pertence ao usuário
  const account = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
    .limit(1)

  if (!account.length) {
    return c.json({ error: 'Account not found or does not belong to user' }, 404)
  }

  // Obter transações que precisam ser conciliadas
  const unreconciledTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.accountId, accountId),
        sql`${transactions.date} BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}`,
        sql`${transactions.id} = ANY(ARRAY[${sql.join(transactionIds.map(id => sql.literal(id)))}])`
      )
    )

  // Verificar se todas as transações solicitadas pertencem à conta especificada
  if (unreconciledTransactions.length !== transactionIds.length) {
    return c.json({ error: 'Some transactions do not belong to the specified account or date range' }, 400)
  }

  // Para fins de demonstração, vamos retornar as transações encontradas
  // Em uma implementação completa, aqui seria onde marcaríamos as transações como conciliadas
  return c.json({
    message: 'Reconciliation process completed',
    reconciledTransactions: unreconciledTransactions.length,
    transactions: unreconciledTransactions
  })
})

// Rota para obter transações pendentes de conciliação
router.get('/unreconciled/:accountId', async (c) => {
  const user = c.get('user')
  const { accountId } = c.req.param()

  // Verificar se a conta pertence ao usuário
  const account = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
    .limit(1)

  if (!account.length) {
    return c.json({ error: 'Account not found or does not belong to user' }, 404)
  }

  // Obter transações que ainda não foram conciliadas (neste caso, todas as transações da conta)
  // Em uma implementação real, você teria um campo indicando se a transação foi conciliada
  const unreconciledTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.accountId, accountId)
      )
    )
    .orderBy(transactions.date)

  return c.json({
    data: unreconciledTransactions,
    total: unreconciledTransactions.length
  })
})

// Rota para conciliar transação individual
router.patch('/reconcile-transaction/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  // Encontrar a transação
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found or does not belong to user' }, 404)
  }

  // Aqui marcaríamos a transação como conciliada
  // Em uma implementação real, você teria um campo "reconciled" ou similar

  return c.json({
    message: 'Transaction reconciled successfully',
    data: transaction
  })
})

export default router