import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { monthlyBudgets, budgetCategories, transactions, pushNotifications } from '../db/schema'
import { eq, and, sum, gte, lte, inArray, sql } from 'drizzle-orm'
import { requireAuth, logAudit } from '../middleware/auth'
import { nanoid } from 'nanoid'

const router = new Hono()
router.use(requireAuth)

// Schema para criação de orçamento mensal
const createBudgetSchema = z.object({
  month: monthSchema,
  year: yearSchema,
  totalBudget: amountSchema,
  context: z.enum(['individual', 'joint'], { errorMap: () => ({ message: 'Context must be individual or joint' }) }),
  categories: z.array(z.object({
    category: z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']),
    limitAmount: amountSchema,
    alertThreshold: thresholdSchema.default(80.00),
  })).optional(),
})

// Schema para parâmetros de rota
const budgetParamsSchema = z.object({
  month: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 1 && val <= 12, {
      message: 'Month must be between 1 and 12',
    }),
  year: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 2020 && val <= 2100, {
      message: 'Year must be between 2020 and 2100',
    }),
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
  totalBudget: amountSchema.optional(),
  categories: z.array(z.object({
    category: z.enum(['dining', 'home', 'transport', 'shopping', 'health', 'travel', 'bills', 'salary', 'investment', 'other']),
    limitAmount: amountSchema,
    alertThreshold: thresholdSchema.default(80.00),
  })).optional(),
})

// Schema para confirmação de deleção
const deleteConfirmationSchema = z.object({
  confirm: z.boolean().refine(val => val === true, {
    message: 'Confirmation is required to delete a budget',
  }),
}).optional()

// Schema reutilizável para valores monetários (positivos, máximo 999999.99)
const amountSchema = z.number()
  .positive('Amount must be positive')
  .max(999999.99, 'Amount exceeds maximum allowed (999999.99)')

// Schema reutilizável para month (1-12)
const monthSchema = z.number()
  .int()
  .min(1, 'Month must be at least 1')
  .max(12, 'Month must be at most 12')

// Schema reutilizável para year (2020-2100)
const yearSchema = z.number()
  .int()
  .min(2020, 'Year must be at least 2020')
  .max(2100, 'Year must be at most 2100')

// Schema reutilizável para threshold (0-100)
const thresholdSchema = z.number()
  .min(0, 'Threshold must be at least 0')
  .max(100, 'Threshold must be at most 100')

// Schema para query params do histórico
const budgetHistoryQuerySchema = z.object({
  limit: z.string()
    .optional()
    .default('10')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z.string()
    .optional()
    .default('0')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 0, {
      message: 'Offset must be non-negative',
    }),
  year: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .refine(val => val === undefined || (!isNaN(val) && val >= 2020 && val <= 2100), {
      message: 'Year must be between 2020 and 2100',
    }),
})

// Schema para cálculo de gastos
const calculateBudgetSchema = z.object({
  month: monthSchema,
  year: yearSchema,
  context: z.enum(['individual', 'joint']).optional().default('individual'),
})

// Schema para query params de alerts (opcional, para filtrar por mês/ano)
const budgetAlertsQuerySchema = z.object({
  month: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .refine(val => val === undefined || (!isNaN(val) && val >= 1 && val <= 12), {
      message: 'Month must be between 1 and 12',
    }),
  year: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .refine(val => val === undefined || (!isNaN(val) && val >= 2020 && val <= 2100), {
      message: 'Year must be between 2020 and 2100',
    }),
  context: z.enum(['individual', 'joint']).optional().default('individual'),
})

/**
 * POST /api/budget/calculate
 * Calcula gastos do mês baseado nas transações e atualiza budget_categories.spentAmount
 */
router.post('/calculate', zValidator('json', calculateBudgetSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const { month, year, context } = body

  // Validação: usuário precisa estar em casal para contexto joint
  if (context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to calculate joint budget' }, 403)
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

  // Define o período do mês
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

  // Calcula o total gasto no mês e prepara atualização das categorias
  let totalSpent = 0
  const categoriesWithSpent = categories.map(cat => {
    const spent = parseFloat(expensesMap.get(cat.category) || '0')
    totalSpent += spent
    
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

  // Calcula porcentagem total utilizada
  const budgetTotal = parseFloat(budget.totalBudget)
  const percentageUsed = budgetTotal > 0 
    ? Math.min(((totalSpent / budgetTotal) * 100).toFixed(2), '100.00')
    : '0.00'

  // Log de auditoria
  await logAudit(
    user.id,
    'update',
    'monthly_budget',
    budget.id,
    null,
    { 
      month, 
      year, 
      context, 
      totalSpent,
      categoriesUpdated: categoriesWithSpent.length 
    },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({
    data: {
      categories: categoriesWithSpent,
      totalSpent,
      percentageUsed,
    }
  })
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

/**
 * DELETE /api/budget/:id
 * Deleta um orçamento existente (hard delete com confirmação de segurança)
 */
router.delete('/:id', zValidator('param', budgetIdParamsSchema), zValidator('json', deleteConfirmationSchema), async (c) => {
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

  // Validação: usuário só pode deletar seu próprio orçamento
  if (budget.userId !== user.id) {
    return c.json({ error: 'You do not have permission to delete this budget' }, 403)
  }

  // Validação: usuário precisa estar em casal para deletar orçamento joint
  if (budget.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'You must be in a couple to delete joint budgets' }, 403)
  }

  // Validação: confirmação é obrigatória
  if (!body?.confirm) {
    return c.json({ 
      error: 'Confirmation required',
      details: 'Please provide { "confirm": true } in the request body to delete this budget'
    }, 400)
  }

  // Armazena dados para auditoria antes de deletar
  const deletedBudgetData = {
    id: budget.id,
    month: budget.month,
    year: budget.year,
    totalBudget: parseFloat(budget.totalBudget),
    context: budget.context,
  }

  // Busca categorias associadas para auditoria
  const categories = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.budgetId, id))

  const deletedCategoriesData = categories.map(cat => ({
    category: cat.category,
    limitAmount: parseFloat(cat.limitAmount),
    spentAmount: parseFloat(cat.spentAmount),
  }))

  // Hard delete: deleta categorias primeiro (devido ao cascade, mas fazemos explícito para clareza)
  await db
    .delete(budgetCategories)
    .where(eq(budgetCategories.budgetId, id))

  // Deleta o orçamento principal
  await db
    .delete(monthlyBudgets)
    .where(eq(monthlyBudgets.id, id))

  // Log de auditoria para deleção
  await logAudit(
    user.id,
    'delete',
    'monthly_budget',
    id,
    { 
      budget: deletedBudgetData,
      categories: deletedCategoriesData,
    },
    null,
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({ 
    data: { 
      message: 'Budget deleted successfully',
      deletedBudget: deletedBudgetData,
    }
  }, 200)
})

/**
 * GET /api/budget/history
 * Retorna histórico de orçamentos com resumo
 */
router.get('/history', zValidator('query', budgetHistoryQuerySchema), async (c) => {
  const user = c.get('user')
  const query = c.req.valid('query')

  // Validação já feita pelo Zod - extrair valores diretamente
  const limit = query.limit
  const offset = query.offset
  const year = query.year

  // Monta as condições da query
  const whereConditions = [
    eq(monthlyBudgets.userId, user.id),
  ]

  // Filtra por ano se fornecido
  if (year !== undefined) {
    whereConditions.push(eq(monthlyBudgets.year, year))
  }

  // Busca orçamentos ordenados por ano/mês decrescente (mais recentes primeiro)
  const budgets = await db
    .select()
    .from(monthlyBudgets)
    .where(and(...whereConditions))
    .orderBy(
      monthlyBudgets.year,
      monthlyBudgets.month
    )
    .limit(limit)
    .offset(offset)

  // Para cada orçamento, busca categorias e calcula gastos
  const budgetsWithSummary = await Promise.all(
    budgets.map(async (budget) => {
      // Busca categorias do orçamento
      const categories = await db
        .select()
        .from(budgetCategories)
        .where(eq(budgetCategories.budgetId, budget.id))

      // Define período do mês para cálculo de gastos
      const startDate = new Date(budget.year, budget.month - 1, 1)
      const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59, 999)

      // Monta condições para transações
      const transactionWhereConditions = [
        eq(transactions.userId, user.id),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.context, budget.context)
      ]

      // Se for contexto joint, inclui transações do casal
      if (budget.context === 'joint' && budget.coupleId) {
        transactionWhereConditions.push(eq(transactions.coupleId, budget.coupleId))
      }

      // Busca despesas por categoria
      const expensesByCategory = await db
        .select({
          category: transactions.category,
          total: sum(transactions.amount).as('total_spent')
        })
        .from(transactions)
        .where(and(...transactionWhereConditions))
        .groupBy(transactions.category)

      // Converte para mapa
      const expensesMap = new Map<string, string>()
      expensesByCategory.forEach(exp => {
        if (exp.category && exp.total) {
          expensesMap.set(exp.category, exp.total)
        }
      })

      // Calcula totais
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

      const budgetTotal = parseFloat(budget.totalBudget)
      const remainingTotal = budgetTotal - spentTotal

      // Retorna resumo do orçamento
      return {
        id: budget.id,
        month: budget.month,
        year: budget.year,
        context: budget.context,
        totalBudget: budgetTotal,
        spentTotal,
        remainingTotal,
        percentageUsed: budgetTotal > 0 
          ? Math.min(((spentTotal / budgetTotal) * 100).toFixed(2), '100.00')
          : '0.00',
        categoriesCount: categories.length,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      }
    })
  )

  // Ordena por ano/mês decrescente (mais recentes primeiro)
  budgetsWithSummary.sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year
    }
    return b.month - a.month
  })

  // Log de auditoria
  await logAudit(
    user.id,
    'read',
    'monthly_budget',
    'history',
    null,
    { limit, offset, year, count: budgetsWithSummary.length },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  return c.json({
    data: {
      budgets: budgetsWithSummary,
      meta: {
        limit,
        offset,
        year: year ?? null,
        total: budgetsWithSummary.length,
      }
    }
  })
})

/**
 * GET /api/budget/alerts
 * Verifica categorias que ultrapassaram o threshold (ex: 80%, 100%)
 * Cria notificações do tipo budget_alert automaticamente
 * Retorno: { data: { alerts: [{ category, limit, spent, percentage }] } }
 */
router.get('/alerts', zValidator('query', budgetAlertsQuerySchema), async (c) => {
  const user = c.get('user')
  const query = c.req.valid('query')

  // Validação já feita pelo Zod - extrair valores diretamente
  const month = query.month
  const year = query.year

  const context = query.context
  // Busca todos os orçamentos ativos do usuário (últimos 3 meses para eficiência)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const whereConditions: any[] = [
    eq(monthlyBudgets.userId, user.id),
  ]

  // Filtra por contexto
  whereConditions.push(eq(monthlyBudgets.context, context))

  // Filtra por mês/ano se fornecidos
  if (month !== undefined && year !== undefined) {
    whereConditions.push(eq(monthlyBudgets.month, month))
    whereConditions.push(eq(monthlyBudgets.year, year))
  } else {
    // Caso contrário, usa filtro de últimos 3 meses
    whereConditions.push(
      gte(monthlyBudgets.year, threeMonthsAgo.getFullYear()),
      sql`(${monthlyBudgets.year} > ${threeMonthsAgo.getFullYear()} OR (${monthlyBudgets.year} = ${threeMonthsAgo.getFullYear()} AND ${monthlyBudgets.month} >= ${threeMonthsAgo.getMonth() + 1}))`
    )
  }

  const budgets = await db
    .select()
    .from(monthlyBudgets)
    .where(and(...whereConditions))
    .orderBy(monthlyBudgets.year, monthlyBudgets.month)

  const allAlerts: Array<{
    category: string
    limit: number
    spent: number
    percentage: number
    threshold: number
    budgetId: string
    month: number
    year: number
  }> = []

  // Para cada orçamento, verifica categorias que ultrapassaram o threshold
  for (const budget of budgets) {
    // Busca categorias do orçamento
    const categories = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.budgetId, budget.id))

    // Define período do mês para cálculo de gastos
    const startDate = new Date(budget.year, budget.month - 1, 1)
    const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59, 999)

    // Monta condições para transações
    const transactionWhereConditions = [
      eq(transactions.userId, user.id),
      eq(transactions.type, 'expense'),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate),
      eq(transactions.context, budget.context)
    ]

    // Se for contexto joint, inclui transações do casal
    if (budget.context === 'joint' && budget.coupleId) {
      transactionWhereConditions.push(eq(transactions.coupleId, budget.coupleId))
    }

    // Busca despesas por categoria
    const expensesByCategory = await db
      .select({
        category: transactions.category,
        total: sum(transactions.amount).as('total_spent')
      })
      .from(transactions)
      .where(and(...transactionWhereConditions))
      .groupBy(transactions.category)

    // Converte para mapa
    const expensesMap = new Map<string, string>()
    expensesByCategory.forEach(exp => {
      if (exp.category && exp.total) {
        expensesMap.set(exp.category, exp.total)
      }
    })

    // Verifica cada categoria contra seu threshold
    for (const cat of categories) {
      const spent = parseFloat(expensesMap.get(cat.category) || '0')
      const limit = parseFloat(cat.limitAmount)
      const threshold = parseFloat(cat.alertThreshold || '80')

      // Calcula porcentagem usada
      const percentage = limit > 0 ? (spent / limit) * 100 : 0

      // Se ultrapassou o threshold, cria alerta
      if (percentage >= threshold) {
        allAlerts.push({
          category: cat.category,
          limit,
          spent,
          percentage: Math.min(percentage, 100),
          threshold,
          budgetId: budget.id,
          month: budget.month,
          year: budget.year,
        })
      }
    }
  }

  // Cria notificações para cada alerta encontrado
  const notificationsToCreate = allAlerts.map(alert => ({
    id: nanoid(),
    userId: user.id,
    type: 'budget_alert' as const,
    title: `Alerta de Orçamento: ${alert.category}`,
    message: `Você gastou ${alert.percentage.toFixed(1)}% do limite de ${alert.category} (R$ ${alert.spent.toFixed(2)} de R$ ${alert.limit.toFixed(2)})`,
    data: JSON.stringify({
      category: alert.category,
      limit: alert.limit,
      spent: alert.spent,
      percentage: alert.percentage,
      threshold: alert.threshold,
      budgetId: alert.budgetId,
      month: alert.month,
      year: alert.year,
    }),
  }))

  // Insere notificações se houver alertas
  if (notificationsToCreate.length > 0) {
    await db
      .insert(pushNotifications)
      .values(notificationsToCreate)
  }

  // Log de auditoria
  await logAudit(
    user.id,
    'read',
    'budget_alerts',
    'check',
    null,
    { alertsCount: allAlerts.length, notificationsCreated: notificationsToCreate.length },
    c.req.header('X-Forwarded-For'),
    c.req.header('User-Agent')
  )

  // Formata resposta
  const formattedAlerts = all