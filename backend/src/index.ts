import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import authRoutes from './routes/auth'
import transactionRoutes from './routes/transactions'
import savingsRoutes from './routes/savings'
import accountRoutes from './routes/accounts'
import creditCardStatementsRoutes from './routes/credit-card-statements'
import bankReconciliationRoutes from './routes/bank-reconciliation'
import importTransactionsRoutes from './routes/import-transactions'
import recurringRoutes from './routes/recurring'
import notificationRoutes from './routes/notifications'
import budgetRoutes from './routes/budget'
import coupleRoutes from './routes/couples'

const app = new Hono()

app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}))

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

app.route('/api/auth', authRoutes)
app.route('/api/transactions', transactionRoutes)
app.route('/api/savings', savingsRoutes)
app.route('/api/accounts', accountRoutes)
app.route('/api/credit-card-statements', creditCardStatementsRoutes)
app.route('/api/bank-reconciliation', bankReconciliationRoutes)
app.route('/api/import-transactions', importTransactionsRoutes)
app.route('/api/recurring', recurringRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/budget', budgetRoutes)
app.route('/api/couples', coupleRoutes)

app.notFound((c) => c.json({ error: 'Not Found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

const port = parseInt(process.env.PORT || '3000')
console.log(`🚀 FinCouple API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
