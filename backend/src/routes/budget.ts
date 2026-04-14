import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { monthlyBudgets, budgetCategories, transactions } from '../db/schema'
import { eq, and, sum, gte, lte, inArray } from 'drizzle-orm'
import { requireAuth, logAudit } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

// Schema para criação de orçamento mensal
const createBudgetSchema = z.object({
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020).max(2100, 'Year must be between 2020 and 2100'),
  totalBudget: z.number().positive('Total budget must be positive').max(999999.99, 'Total budget exceeds maximum allowed'),
  context: z.enum(['individual', 'joint'], { errorMap: () => ({ message: 'Context must be individual or joint' }) }),
  categories: z.array(z.object({
    category: z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']),
    limitAmount: z.number().positive('Limit amount must be positive').max(999999.99, 'Limit amount exceeds maximum allowed'),
    alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100').default(80.00),
  })).optional(),
})

// Schema para parâmetros de rota
const budgetParamsSchema = z.object({
  month: z.string().transform(val => parseInt(val, 10)),
  year: z.string().transform(val => parseInt(val, 10)),
})

// Schema para query params
const budgetQuerySchema = z.object({
  context: z.enum(['individual', 'joint']).optional().default('individual'),
})

// Schema para parâmetro de ID
const budgetIdParamsSchema = z.object({
  id: z.string().min(1, 'Budget ID is required'),
})

// Schema para atualização de orçamento (apenas campos atualizáveis)
const updateBudgetSchema = z.object({
  totalBudget: z.number().positive('Total budget must be positive').max(999999.99, 'Total budget exceeds maximum allowed').optional(),
  categories: z.array(z.object({
    category: z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']),
    limitAmount: z.number().positive('Limit amount must be positive').max(999999.99, 'Limit amount exceeds maximum allowed'),
    alertThreshold: z.number().min(0).max(100, 'Alert threshold must be between 0 and 100').default(80.00),
  })).optional(),
})

/**
 * POST /api/budget
 * Cria um novo orçamento mensal com categorias opcionais
 */
router.post('/', zValidator('json', createBudgetSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  // Validação: usuário precisa estar em casal para criar orçamento joint
  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to create joint budgets' }, 400)
  }

  // Verifica se já existe orçamento para este mês/ano/contexto
  const existingBudget = await db
    .select()
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.userId, user.id),
        eq(monthlyBudgets.month, body.month),
        eq(monthlyBudgets.year, body.year),
        eq(monthlyBudgets.context, body.context)
      )
    )
    .limit(1)

  if (existingBudget.length > 0) {
    return c.json({ error: 'Budget already exists for this month/year/context' }, 409)
  }

  // Cria o orçamento principal
  const [budget] = await db
    .insert(monthlyBudgets)
    .values({
      id: nanoid(),
      userId: user.id,
      coupleId: body.context === 'joint' ? user.coupleId : null,
      month: body.month,
      year: body.year,
      totalBudget: String(body.totalBudget),
      context: body.context,
    })
    .returning()

  // Cria as categorias se fornecidas
  let categories = []
  if (body.categories && body.categories.length > 0) {
    const categoryValues = body.categories.map(cat => ({
      id: nanoid(),
      budgetId: budget.id,
      category: cat.category,
      limitAmount: String(cat.limitAmount),
      alertThreshold: String(cat.alertThreshold ?? 80.00),
      spentAmount: '0',
    }))

    categories = await db
      .insert(budgetCategories)
      .values(categoryValues)
      .returning()
  }

  // Log de auditoria
  await logAudit(
    user.id,
    'create',
    'monthly_budget',
    budget.id,
    null,
    { 
      month: body.month, 
      year: body.year, 
      totalBudget: body.totalBudget, 
      context: body.context,
      categories: body.categories 
    },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({ data: { budget, categories } }, 201)
})

/**
 * GET /api/budget/:month/:year
 * Busca orçamento do mês com categorias e totais calculados
 */
router.get('/:month/:year', zValidator('param', budgetParamsSchema), zValidator('query', budgetQuerySchema), async (c) => {
  const user = c.get('user')
  const params = c.req.valid('param')
  const query = c.req.valid('query')

  const { month, year } = params
  const context = query.context

  // Validação dos parâmetros
  if (month < 1 || month > 12) {
    return c.json({ error: 'Month must be between 1 and 12' }, 400)
  }

  if (year < 2020 || year > 2100) {
    return c.json({ error: 'Year must be between 2020 and 2100' }, 400)
  }

  // Validação: usuário precisa estar em casal para acessar orçamento joint
  if (context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to access joint budgets' }, 403)
  }

  // Busca o orçamento do mês/ano/contexto
  const budgetResult = await db
    .select()
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.userId, user.id),
        eq(monthlyBudgets.month, month),
        eq(monthlyBudgets.year, year),
        eq(monthlyBudgets.context, context)
      )
    )
    .limit(1)

  if (budgetResult.length === 0) {
    return c.json({ error: 'Budget not found for this month/year/context' }, 404)
  }

  const budget = budgetResult[0]

  // Busca as categorias do orçamento
  const categories = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.budgetId, budget.id))

  // Calcula os gastos totais do mês baseado nas transações
  // Define o início e fim do mês
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  // Monta a condição WHERE para transações
  const transactionWhereConditions = [
    eq(transactions.userId, user.id),
    eq(transactions.type, 'expense'),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    eq(transactions.context, context)
  ]

  // Se for contexto joint, inclui transações do casal
  if (context === 'joint' && user.coupleId) {
    transactionWhereConditions.push(eq(transactions.coupleId, user.coupleId))
  }

  // Busca todas as despesas do mês agrupadas por categoria
  const expensesByCategory = await db
    .select({
      category: transactions.category,
      total: sum(transactions.amount).as('total_spent')
    })
    .from(transactions)
    .where(and(...transactionWhereConditions))
    .groupBy(transactions.category)

  // Converte para um mapa fácil de consultar
  const expensesMap = new Map<string, string>()
  expensesByCategory.forEach(exp => {
    if (exp.category && exp.total) {
      expensesMap.set(exp.category, exp.total)
    }
  })

  // Calcula o total gasto no mês
  let spentTotal = 0
  const categoriesWithSpent = categories.map(cat => {
    const spent = parseFloat(expensesMap.get(cat.category) || '0')
    spentTotal += spent
    
    return {
      ...cat,
      spentAmount: String(spent),
      remainingAmount: String(parseFloat(cat.limitAmount) - spent),
      percentageUsed: cat.limitAmount !== '0' 
        ? Math.min(((spent / parseFloat(cat.limitAmount)) * 100).toFixed(2), '100.00')
        : '0.00',
    }
  })

  // Calcula o restante total do orçamento
  const budgetTotal = parseFloat(budget.totalBudget)
  const remainingTotal = budgetTotal - spentTotal

  // Log de auditoria para acesso ao orçamento
  await logAudit(
    user.id,
    'read',
    'monthly_budget',
    budget.id,
    null,
    { month, year, context },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({
    data: {
      budget: {
        ...budget,
        totalBudget: budgetTotal,
      },
      categories: categoriesWithSpent,
      spentTotal,
      remainingTotal,
      percentageUsed: budgetTotal > 0 
        ? Math.min(((spentTotal / budgetTotal) * 100).toFixed(2), '100.00')
        : '0.00',
    }
  })
})

/**
 * PATCH /api/budget/:id
 * Atualiza orçamento existente (totalBudget e/ou categorias)
 */
router.patch('/:id', zValidator('param', budgetIdParamsSchema), zValidator('json', updateBudgetSchema), async (c) => {
  const user = c.get('user')
  const params = c.req.valid('param')
  const body = c.req.valid('json')
  const { id } = params

  // Busca o orçamento pelo ID
  const budgetResult = await db
    .select()
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.id, id))
    .limit(1)

  if (budgetResult.length === 0) {
    return c.json({ error: 'Budget not found' }, 404)
  }

  const budget = budgetResult[0]

  // Validação: usuário só pode editar seu próprio orçamento
  if (budget.userId !== user.id) {
    return c.json({ error: 'You do not have permission to edit this budget' }, 403)
  }

  // Validação: usuário precisa estar em casal para editar orçamento joint
  if (budget.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to edit joint budgets' }, 403)
  }

  // Prepara valores para atualização
  const updateValues: Partial<typeof monthlyBudgets.$inferInsert> = {}

  // Atualiza totalBudget se fornecido
  if (body.totalBudget !== undefined) {
    updateValues.totalBudget = String(body.totalBudget)
  }

  // Atualiza updatedAt se houver alguma modificação
  if (Object.keys(updateValues).length > 0 || body.categories !== undefined) {
    updateValues.updatedAt = new Date()
  }

  let updatedBudget = budget

  // Executa atualização do orçamento principal se necessário
  if (Object.keys(updateValues).length > 0) {
    const [updated] = await db
      .update(monthlyBudgets)
      .set(updateValues)
      .where(eq(monthlyBudgets.id, id))
      .returning()
    
    updatedBudget = updated
  }

  // Atualiza ou cria categorias se fornecidas
  let categories = []
  if (body.categories !== undefined) {
    // Remove categorias existentes se fornecido array vazio ou faz upsert
    if (body.categories.length === 0) {
      // Deleta todas as categorias existentes
      await db
        .delete(budgetCategories)
        .where(eq(budgetCategories.budgetId, id))
      categories = []
    } else {
      // Deleta categorias existentes e insere novas (abordagem mais simples)
      await db
        .delete(budgetCategories)
        .where(eq(budgetCategories.budgetId, id))

      const categoryValues = body.categories.map(cat => ({
        id: nanoid(),
        budgetId: id,
        category: cat.category,
        limitAmount: String(cat.limitAmount),
        alertThreshold: String(cat.alertThreshold ?? 80.00),
        spentAmount: '0',
      }))

      categories = await db
        .insert(budgetCategories)
        .values(categoryValues)
        .returning()
    }
  } else {
    // Se categorias não foram fornecidas, busca as existentes
    categories = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.budgetId, id))
  }

  // Calcula os gastos totais do mês baseado nas transações
  const startDate = new Date(updatedBudget.year, updatedBudget.month - 1, 1)
  const endDate = new Date(updatedBudget.year, updatedBudget.month, 0, 23, 59, 59, 999)

  const transactionWhereConditions = [
    eq(transactions.userId, user.id),
    eq(transactions.type, 'expense'),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    eq(transactions.context, updatedBudget.context)
  ]

  if (updatedBudget.context === 'joint' && user.coupleId) {
    transactionWhereConditions.push(eq(transactions.coupleId, user.coupleId))
  }

  const expensesByCategory = await db
    .select({
      category: transactions.category,
      total: sum(transactions.amount).as('total_spent')
    })
    .from(transactions)
    .where(and(...transactionWhereConditions))
    .groupBy(transactions.category)

  const expensesMap = new Map<string, string>()
  expensesByCategory.forEach(exp => {
    if (exp.category && exp.total) {
      expensesMap.set(exp.category, exp.total)
    }
  })

  // Atualiza spentAmount das categorias e calcula totais
  let spentTotal = 0
  const categoriesWithSpent = categories.map(cat => {
    const spent = parseFloat(expensesMap.get(cat.category) || '0')
    spentTotal += spent
    
    return {
      ...cat,
      spentAmount: String(spent),
      remainingAmount: String(parseFloat(cat.limitAmount) - spent),
      percentageUsed: cat.limitAmount !== '0' 
        ? Math.min(((spent / parseFloat(cat.limitAmount)) * 100).toFixed(2), '100.00')
        : '0.00',
    }
  })

  // Atualiza spentAmount no banco de dados para cada categoria
  for (const cat of categoriesWithSpent) {
    await db
      .update(budgetCategories)
      .set({ 
        spentAmount: cat.spentAmount,
        updatedAt: new Date()
      })
      .where(eq(budgetCategories.id, cat.id))
  }

  // Calcula o restante total do orçamento
  const budgetTotal = parseFloat(updatedBudget.totalBudget)
  const remainingTotal = budgetTotal - spentTotal

  // Log de auditoria para atualização
  await logAudit(
    user.id,
    'update',
    'monthly_budget',
    budget.id,
    { 
      totalBudget: parseFloat(budget.totalBudget),
      categories: categories.map(c => ({ category: c.category, limitAmount: parseFloat(c.limitAmount) }))
    },
    { 
      totalBudget: body.totalBudget ?? parseFloat(budget.totalBudget),
      categories: body.categories?.map(c => ({ category: c.category, limitAmount: c.limitAmount })) ?? categories.map(c => ({ category: c.category, limitAmount: parseFloat(c.limitAmount) }))
    },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({
    data: {
      budget: {
        ...updatedBudget,
        totalBudget: budgetTotal,
      },
      categories: categoriesWithSpent,
      spentTotal,
      remainingTotal,
      percentageUsed: budgetTotal > 0 
        ? Math.min(((spentTotal / budgetTotal) * 100).toFixed(2), '100.00')
        : '0.00',
    }
  })
})

export default router
