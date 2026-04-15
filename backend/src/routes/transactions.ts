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
  tagIds: z.array(z.string()).optional(), // IDs das tags para associar à transação
})

const listQuerySchema = z.object({
  context: z.enum(['individual', 'joint']).optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(), // Novo campo para busca textual
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

router.get('/', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user')
  const { context, category, from, to, search, page, limit } = c.req.valid('query')

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
  if (search) {
    // Busca textual em título e notas
    conditions.push(
      or(
        sql`lower(${transactions.title}) LIKE lower('%' || ${search} || '%')`,
        sql`lower(${transactions.notes} || '') LIKE lower('%' || ${search} || '%')`
      )
    )
  }

  const offset = (page - 1) * limit

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .offset(offset)

  // Obter tags e anexos para cada transação
  const transactionsWithDetails = await Promise.all(rows.map(async (tx) => {
    // Obter tags associadas
    const tags = await db
      .select({
        id: transactionTags.id,
        name: transactionTags.name,
        color: transactionTags.color,
      })
      .from(transactionTags)
      .innerJoin(transactionTagMappings, eq(transactionTagMappings.tagId, transactionTags.id))
      .where(eq(transactionTagMappings.transactionId, tx.id))

    // Obter anexos associados (apenas informações básicas para não sobrecarregar a resposta)
    const attachments = await db
      .select({
        id: transactionAttachments.id,
        fileName: transactionAttachments.fileName,
        fileType: transactionAttachments.fileType,
        fileSize: transactionAttachments.fileSize,
      })
      .from(transactionAttachments)
      .where(eq(transactionAttachments.transactionId, tx.id))

    return {
      ...tx,
      tags,
      attachments,
    }
  }))

  const countRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(and(...conditions))

  return c.json({
    data: transactionsWithDetails,
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

  // Obter tags associadas
  const tags = await db
    .select({
      id: transactionTags.id,
      name: transactionTags.name,
      color: transactionTags.color,
    })
    .from(transactionTags)
    .innerJoin(transactionTagMappings, eq(transactionTagMappings.tagId, transactionTags.id))
    .where(eq(transactionTagMappings.transactionId, id))

  // Obter anexos associados
  const attachments = await db
    .select({
      id: transactionAttachments.id,
      fileName: transactionAttachments.fileName,
      fileType: transactionAttachments.fileType,
      fileSize: transactionAttachments.fileSize,
      createdAt: transactionAttachments.createdAt,
    })
    .from(transactionAttachments)
    .where(eq(transactionAttachments.transactionId, id))

  // Retornar transação com tags e anexos
  return c.json({
    data: {
      ...tx,
      tags,
      attachments,
    }
  })
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

  // Associar tags se fornecidas
  if (body.tagIds && body.tagIds.length > 0) {
    // Verificar se todas as tags pertencem ao usuário
    const tags = await db
      .select()
      .from(transactionTags)
      .where(
        and(
          eq(transactionTags.userId, user.id),
          sql`${transactionTags.id} = ANY(ARRAY[${sql.join(body.tagIds.map(id => sql.literal(id)))}]::text[])`
        )
      )

    if (tags.length !== body.tagIds.length) {
      return c.json({ error: 'Some tags do not belong to user' }, 400)
    }

    // Criar associações de tags
    await db.insert(transactionTagMappings).values(
      body.tagIds.map(tagId => ({
        id: nanoid(),
        transactionId: tx.id,
        tagId,
      }))
    )
  }

  // Obter as tags associadas para retornar na resposta
  const tags = await db
    .select({
      id: transactionTags.id,
      name: transactionTags.name,
      color: transactionTags.color,
    })
    .from(transactionTags)
    .innerJoin(transactionTagMappings, eq(transactionTagMappings.tagId, transactionTags.id))
    .where(eq(transactionTagMappings.transactionId, tx.id))

  return c.json({ data: { ...tx, tags, attachments: [] } }, 201)
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
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.accountId !== undefined) updateData.accountId = body.accountId

    // Handle account balance update if amount or accountId changed
    if (body.amount !== undefined && existing.accountId) {
      const oldAmount = parseFloat(existing.amount)
      const newAmount = body.amount
      const balanceChange = newAmount - oldAmount

      await db
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, existing.accountId))
    }

    // Handle accountId change (transfer between accounts)
    if (body.accountId !== undefined && body.accountId !== existing.accountId) {
      // Remove from old account
      if (existing.accountId) {
        const oldAmount = parseFloat(existing.amount)
        await db
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} - ${oldAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, existing.accountId))
      }

      // Add to new account
      if (body.accountId) {
        const newAmount = body.amount !== undefined ? body.amount : parseFloat(existing.amount)
        await db
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${newAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, body.accountId))
      }
    }

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning()

    // Atualizar tags se fornecidas
    if (body.tagIds !== undefined) {
      // Remover associações antigas
      await db
        .delete(transactionTagMappings)
        .where(eq(transactionTagMappings.transactionId, id))

      // Adicionar novas associações se houver tags
      if (body.tagIds.length > 0) {
        // Verificar se todas as tags pertencem ao usuário
        const tags = await db
          .select()
          .from(transactionTags)
          .where(
            and(
              eq(transactionTags.userId, user.id),
              sql`${transactionTags.id} = ANY(ARRAY[${sql.join(body.tagIds.map(id => sql.literal(id)))}]::text[])`
            )
          )

        if (tags.length !== body.tagIds.length) {
          return c.json({ error: 'Some tags do not belong to user' }, 400)
        }

        // Criar novas associações
        await db.insert(transactionTagMappings).values(
          body.tagIds.map(tagId => ({
            id: nanoid(),
            transactionId: id,
            tagId,
          }))
        )
      }
    }

    // Obter as tags atualizadas para retornar na resposta
    const tags = await db
      .select({
        id: transactionTags.id,
        name: transactionTags.name,
        color: transactionTags.color,
      })
      .from(transactionTags)
      .innerJoin(transactionTagMappings, eq(transactionTagMappings.tagId, transactionTags.id))
      .where(eq(transactionTagMappings.transactionId, id))

    // Obter anexos também para retornar na resposta
    const attachments = await db
      .select({
        id: transactionAttachments.id,
        fileName: transactionAttachments.fileName,
        fileType: transactionAttachments.fileType,
        fileSize: transactionAttachments.fileSize,
      })
      .from(transactionAttachments)
      .where(eq(transactionAttachments.transactionId, id))

    return c.json({ data: { ...updated, tags, attachments } })
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

  // Obter anexos antes de deletar a transação para poder removê-los fisicamente
  const attachments = await db
    .select()
    .from(transactionAttachments)
    .where(eq(transactionAttachments.transactionId, id))

  // Deletar associações de tags
  await db.delete(transactionTagMappings).where(eq(transactionTagMappings.transactionId, id))

  // Deletar anexos (também remove os arquivos físicos)
  for (const attachment of attachments) {
    try {
      await Bun.$`rm ${attachment.filePath}`
    } catch (error) {
      console.warn('Could not delete attachment file:', error)
      // Continuar mesmo se o arquivo não puder ser apagado
    }
  }

  // Deletar registros de anexos
  await db.delete(transactionAttachments).where(eq(transactionAttachments.transactionId, id))

  // Finalmente deletar a transação
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

router.get('/summary/by-category', async (c) => {
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
  conditions.push(eq(transactions.type, 'expense'))

  const rows = await db
    .select({
      category: transactions.category,
      total: sql<number>`sum(${transactions.amount}::numeric)`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.category)
    .orderBy(sql`sum(${transactions.amount}::numeric) DESC`)

  const totalExpenses = rows.reduce((sum, r) => sum + Math.abs(Number(r.total)), 0)

  const byCategory = rows.map(r => ({
    category: r.category,
    amount: Math.abs(Number(r.total)),
    count: Number(r.count),
    percentage: totalExpenses > 0 ? (Math.abs(Number(r.total)) / totalExpenses) * 100 : 0,
  }))

  return c.json({
    totalExpenses,
    byCategory,
    period: {
      from: startOfMonth.toISOString(),
      to: endOfMonth.toISOString(),
    },
  })
})

router.get('/export', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user')
  const { context, category, from, to } = c.req.valid('query')

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

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))

  // CSV header
  const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Context', 'Notes']
  
  // CSV rows
  const csvRows = rows.map(tx => [
    new Date(tx.date).toISOString().split('T')[0],
    tx.title.replace(/,/g, ';'),
    tx.type,
    tx.category,
    tx.amount,
    tx.context,
    (tx.notes || '').replace(/,/g, ';'),
  ])

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n')

  // Return as CSV file
  return c.body(csvContent, 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="transactions_export_${new Date().toISOString().split('T')[0]}.csv"`,
  })
})

// Rota para gerenciar tags personalizadas
const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // formato hexadecimal
})

router.get('/tags', async (c) => {
  const user = c.get('user')

  const tags = await db
    .select()
    .from(transactionTags)
    .where(eq(transactionTags.userId, user.id))
    .orderBy(desc(transactionTags.createdAt))

  return c.json({ data: tags })
})

router.post('/tags', zValidator('json', tagSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  // Verificar se a tag já existe para este usuário
  const existingTag = await db
    .select()
    .from(transactionTags)
    .where(
      and(
        eq(transactionTags.userId, user.id),
        eq(transactionTags.name, body.name.toLowerCase())
      )
    )
    .limit(1)

  if (existingTag.length > 0) {
    return c.json({ error: 'Tag already exists' }, 400)
  }

  const [tag] = await db
    .insert(transactionTags)
    .values({
      id: nanoid(),
      userId: user.id,
      name: body.name.toLowerCase(),
      color: body.color || '#6366f1',
    })
    .returning()

  return c.json({ data: tag }, 201)
})

router.delete('/tags/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [existingTag] = await db
    .select()
    .from(transactionTags)
    .where(
      and(
        eq(transactionTags.id, id),
        eq(transactionTags.userId, user.id)
      )
    )
    .limit(1)

  if (!existingTag) {
    return c.json({ error: 'Tag not found or not owned by user' }, 404)
  }

  await db
    .delete(transactionTags)
    .where(eq(transactionTags.id, id))

  return c.json({ ok: true })
})

// Rota para associar tags a uma transação
const associateTagSchema = z.object({
  tagIds: z.array(z.string()).min(0).max(10), // máximo de 10 tags por transação
})

router.post('/:id/tags', zValidator('json', associateTagSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const { tagIds } = c.req.valid('json')

  // Verificar se a transação existe e pertence ao usuário
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  const isOwner = transaction.userId === user.id
  const isJointMember = transaction.context === 'joint' && transaction.coupleId === user.coupleId
  if (!isOwner && !isJointMember) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Verificar se todas as tags pertencem ao usuário
  if (tagIds.length > 0) {
    const tags = await db
      .select()
      .from(transactionTags)
      .where(
        and(
          eq(transactionTags.userId, user.id),
          sql`${transactionTags.id} = ANY(ARRAY[${sql.join(tagIds.map(id => sql.literal(id)))}]::text[])`
        )
      )

    if (tags.length !== tagIds.length) {
      return c.json({ error: 'Some tags do not belong to user' }, 400)
    }
  }

  // Remover associações antigas
  await db
    .delete(transactionTagMappings)
    .where(eq(transactionTagMappings.transactionId, id))

  // Criar novas associações
  if (tagIds.length > 0) {
    await db.insert(transactionTagMappings).values(
      tagIds.map(tagId => ({
        id: nanoid(),
        transactionId: id,
        tagId,
      }))
    )
  }

  return c.json({ ok: true })
})

// Rota para obter tags de uma transação específica
router.get('/:id/tags', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  // Verificar se a transação existe e pertence ao usuário
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  const isOwner = transaction.userId === user.id
  const isJointMember = transaction.context === 'joint' && transaction.coupleId === user.coupleId
  if (!isOwner && !isJointMember) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const tags = await db
    .select({
      id: transactionTags.id,
      name: transactionTags.name,
      color: transactionTags.color,
      createdAt: transactionTags.createdAt,
    })
    .from(transactionTags)
    .innerJoin(transactionTagMappings, eq(transactionTagMappings.tagId, transactionTags.id))
    .where(eq(transactionTagMappings.transactionId, id))

  return c.json({ data: tags })
})

// Rota para upload de anexos/comprovantes
import { multipart } from 'hono/multipart'

// Configurar pasta para armazenar anexos
const ATTACHMENTS_DIR = './uploads/attachments'
import { mkdirSync, existsSync } from 'fs'

if (!existsSync(ATTACHMENTS_DIR)) {
  mkdirSync(ATTACHMENTS_DIR, { recursive: true })
}

router.post('/:id/attachments', multipart(), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  // Verificar se a transação existe e pertence ao usuário
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  const isOwner = transaction.userId === user.id
  const isJointMember = transaction.context === 'joint' && transaction.coupleId === user.coupleId
  if (!isOwner && !isJointMember) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const formData = await c.req.parseBody()
  const file = formData.file as File | undefined

  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  // Validar tipo de arquivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF, WEBP' }, 400)
  }

  // Validar tamanho do arquivo (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File too large. Maximum size: 10MB' }, 400)
  }

  // Gerar nome único para o arquivo
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const fileName = `${nanoid()}.${fileExtension}`
  const filePath = `${ATTACHMENTS_DIR}/${fileName}`

  // Salvar arquivo
  const buffer = Buffer.from(await file.arrayBuffer())
  await Bun.write(filePath, buffer)

  // Criar registro do anexo no banco
  const [attachment] = await db
    .insert(transactionAttachments)
    .values({
      id: nanoid(),
      transactionId: id,
      fileName: file.name,
      filePath: filePath,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy: user.id,
    })
    .returning()

  return c.json({ data: attachment }, 201)
})

// Rota para obter anexos de uma transação
router.get('/:id/attachments', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  // Verificar se a transação existe e pertence ao usuário
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  const isOwner = transaction.userId === user.id
  const isJointMember = transaction.context === 'joint' && transaction.coupleId === user.coupleId
  if (!isOwner && !isJointMember) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const attachments = await db
    .select({
      id: transactionAttachments.id,
      fileName: transactionAttachments.fileName,
      fileType: transactionAttachments.fileType,
      fileSize: transactionAttachments.fileSize,
      uploadedBy: transactionAttachments.uploadedBy,
      createdAt: transactionAttachments.createdAt,
    })
    .from(transactionAttachments)
    .where(eq(transactionAttachments.transactionId, id))
    .orderBy(desc(transactionAttachments.createdAt))

  return c.json({ data: attachments })
})

// Rota para baixar um anexo específico
router.get('/:id/attachments/:attachmentId', async (c) => {
  const user = c.get('user')
  const { id, attachmentId } = c.req.param()

  // Verificar se a transação existe e pertence ao usuário
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  const isOwner = transaction.userId === user.id
  const isJointMember = transaction.context === 'joint' && transaction.coupleId === user.coupleId
  if (!isOwner && !isJointMember) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Verificar se o anexo pertence à transação
  const [attachment] = await db
    .select()
    .from(transactionAttachments)
    .where(
      and(
        eq(transactionAttachments.id, attachmentId),
        eq(transactionAttachments.transactionId, id)
      )
    )
    .limit(1)

  if (!attachment) {
    return c.json({ error: 'Attachment not found' }, 404)
  }

  // Ler o arquivo e retornar
  try {
    const file = Bun.file(attachment.filePath)
    const fileExists = await file.exists()

    if (!fileExists) {
      return c.json({ error: 'Attachment file not found' }, 404)
    }

    const fileBuffer = await file.arrayBuffer()
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': attachment.fileType,
        'Content-Disposition': `inline; filename="${attachment.fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error reading attachment file:', error)
    return c.json({ error: 'Could not read attachment file' }, 500)
  }
})

// Rota para deletar um anexo
router.delete('/:id/attachments/:attachmentId', async (c) => {
  const user = c.get('user')
  const { id, attachmentId } = c.req.param()

  // Verificar se a transação existe e pertence ao usuário
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404)
  }

  const isOwner = transaction.userId === user.id
  const isJointMember = transaction.context === 'joint' && transaction.coupleId === user.coupleId
  if (!isOwner && !isJointMember) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Verificar se o anexo pertence à transação e ao usuário
  const [attachment] = await db
    .select()
    .from(transactionAttachments)
    .where(
      and(
        eq(transactionAttachments.id, attachmentId),
        eq(transactionAttachments.transactionId, id),
        eq(transactionAttachments.uploadedBy, user.id)
      )
    )
    .limit(1)

  if (!attachment) {
    return c.json({ error: 'Attachment not found or not owned by user' }, 404)
  }

  // Tentar remover o arquivo físico
  try {
    await Bun.$`rm ${attachment.filePath}`
  } catch (error) {
    console.warn('Could not delete attachment file:', error)
    // Prosseguir com a exclusão do registro mesmo se o arquivo não puder ser apagado
  }

  // Remover o registro do anexo
  await db
    .delete(transactionAttachments)
    .where(eq(transactionAttachments.id, attachmentId))

  return c.json({ ok: true })
})

export default router
