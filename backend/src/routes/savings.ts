import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { savingsGoals, savingsContributions } from '../db/schema'
import { eq, and, or, sql, desc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { nanoid } from 'nanoid'
import { createNotification, notifyCouple } from './notifications'

// Função para calcular a próxima data alvo com base na frequência
function calculateNextTargetDate(currentDate: Date, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}

// Função para verificar se uma meta precisa ser reiniciada (para metas recorrentes)
async function handleRecurringGoal(goalId: string) {
  const goal = await db.query.savingsGoals.findFirst({
    where: eq(savingsGoals.id, goalId),
    with: {
      contributions: {
        orderBy: [desc(savingsContributions.createdAt)],
      }
    }
  });

  if (!goal || !goal.isRecurring) return goal;

  const now = new Date();
  if (goal.nextTargetDate && now > goal.nextTargetDate) {
    // Reiniciar a meta recorrente
    const [updatedGoal] = await db
      .update(savingsGoals)
      .set({
        currentAmount: '0',
        status: 'active',
        updatedAt: new Date(),
        nextTargetDate: calculateNextTargetDate(now, goal.frequency),
      })
      .where(eq(savingsGoals.id, goalId))
      .returning();

    return updatedGoal;
  }

  return goal;
}

const router = new Hono()
router.use(requireAuth)

const baseGoalSchema = z.object({
  title:        z.string().min(1).max(120),
  targetAmount: z.number().positive(),
  context:      z.enum(['individual', 'joint']),
  emoji:        z.string().max(4).optional().default('🎯'),
  deadline:     z.string().datetime().optional(),
  // Campos para metas recorrentes
  isRecurring:  z.boolean().default(false),
  frequency:    z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  nextTargetDate: z.string().datetime().optional(),
})

const goalSchema = baseGoalSchema.refine((data) => {
  if (data.deadline) {
    return new Date(data.deadline) > new Date()
  }
}, {
  message: "A data de prazo não pode ser no passado",
  path: ["deadline"]
})

const contributionSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().max(200).optional(),
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

  // Processar metas recorrentes para verificar se precisam ser reiniciadas
  const processedGoals = await Promise.all(goals.map(async (goal) => {
    if (goal.isRecurring) {
      return await handleRecurringGoal(goal.id);
    }
    return goal;
  }));

  return c.json({ data: processedGoals })
})

router.post('/', zValidator('json', goalSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  if (body.context === 'joint' && !user.coupleId) {
    return c.json({ error: 'Must be in a couple for joint goals' }, 400)
  }

  // Preparar dados para metas recorrentes
  let nextTargetDate = null;
  let originalTargetAmount = null;

  if (body.isRecurring) {
    originalTargetAmount = String(body.targetAmount);
    nextTargetDate = body.nextTargetDate ? new Date(body.nextTargetDate) : calculateNextTargetDate(new Date(), body.frequency || 'monthly');
  }

  const [goal] = await db
    .insert(savingsGoals)
    .values({
      id:                 nanoid(),
      userId:             user.id,
      coupleId:           body.context === 'joint' ? user.coupleId : null,
      title:              body.title,
      targetAmount:       String(body.targetAmount),
      context:            body.context,
      emoji:              body.emoji,
      deadline:           body.deadline ? new Date(body.deadline) : null,
      // Campos para metas recorrentes
      isRecurring:        body.isRecurring,
      frequency:          body.frequency || 'monthly',
      nextTargetDate:     nextTargetDate,
      originalTargetAmount: originalTargetAmount,
    })
    .returning()

  return c.json({ data: goal }, 201)
})


const updateGoalSchema = baseGoalSchema.partial()
router.patch('/:id', zValidator('json', updateGoalSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1)
  if (!goal) return c.json({ error: 'Not found' }, 404)
  if (goal.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  // Atualizar dados para metas recorrentes
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  // Copiar todos os campos válidos do body
  if (body.title !== undefined) updateData.title = body.title;
  if (body.targetAmount !== undefined) updateData.targetAmount = String(body.targetAmount);
  if (body.context !== undefined) updateData.context = body.context;
  if (body.emoji !== undefined) updateData.emoji = body.emoji;
  if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
  if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
  if (body.frequency !== undefined) updateData.frequency = body.frequency;
  if (body.nextTargetDate !== undefined) updateData.nextTargetDate = new Date(body.nextTargetDate);

  // Se for uma meta recorrente e não tenha originalTargetAmount, definir como o targetAmount atual
  if (body.isRecurring && !goal.originalTargetAmount) {
    updateData.originalTargetAmount = goal.targetAmount;
  }

  const [updated] = await db
    .update(savingsGoals)
    .set(updateData)
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

// Rota para verificar e reiniciar metas recorrentes expiradas
router.post('/:id/check-and-reset', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1)
  if (!goal) return c.json({ error: 'Not found' }, 404)
  if (goal.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)
  if (!goal.isRecurring) return c.json({ error: 'Goal is not recurring' }, 400)

  const updatedGoal = await handleRecurringGoal(id);

  return c.json({ data: updatedGoal })
})

// Rota para obter informações sobre metas recorrentes
router.get('/:id/recurrence-info', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).limit(1)
  if (!goal) return c.json({ error: 'Not found' }, 404)
  if (goal.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  if (!goal.isRecurring) {
    return c.json({
      data: {
        isRecurring: false,
        recurrenceInfo: null
      }
    })
  }

  // Calcular informações de recorrência
  const now = new Date();
  const daysUntilNextTarget = goal.nextTargetDate
    ? Math.ceil((goal.nextTargetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return c.json({
    data: {
      isRecurring: true,
      originalTargetAmount: goal.originalTargetAmount,
      nextTargetDate: goal.nextTargetDate,
      daysUntilNextTarget,
      frequency: goal.frequency
    }
  })
})

// Histórico de contribuições
router.get('/:id/contributions', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const goal = await db.query.savingsGoals.findFirst({
    where: eq(savingsGoals.id, id),
    with: {
      contributions: {
        orderBy: [desc(savingsContributions.createdAt)],
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }
    }
  })

  if (!goal) return c.json({ error: 'Not found' }, 404)

  const isOwner = goal.userId === user.id
  const isJoint = goal.context === 'joint' && goal.coupleId === user.coupleId
  if (!isOwner && !isJoint) return c.json({ error: 'Forbidden' }, 403)

  return c.json({ data: goal.contributions })
})

// Rota para obter detalhes de uma meta específica
router.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const goal = await db.query.savingsGoals.findFirst({
    where: eq(savingsGoals.id, id),
    with: {
      contributions: {
        orderBy: [desc(savingsContributions.createdAt)],
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }
    }
  })

  if (!goal) return c.json({ error: 'Not found' }, 404)

  const isOwner = goal.userId === user.id
  const isJoint = goal.context === 'joint' && goal.coupleId === user.coupleId
  if (!isOwner && !isJoint) return c.json({ error: 'Forbidden' }, 403)

  // Verificar se é uma meta recorrente e se precisa reiniciar
  let effectiveGoal = goal;
  if (goal.isRecurring) {
    effectiveGoal = await handleRecurringGoal(id);
  }

  return c.json({ data: effectiveGoal })
})

// Nova contribuição
router.post('/:id/contribute',
  zValidator('json', contributionSchema),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.param()
    const { amount, notes } = c.req.valid('json')

    const goal = await db.query.savingsGoals.findFirst({
      where: eq(savingsGoals.id, id)
    })

    if (!goal) return c.json({ error: 'Not found' }, 404)

    const isOwner = goal.userId === user.id
    const isJoint = goal.context === 'joint' && goal.coupleId === user.coupleId
    if (!isOwner && !isJoint) return c.json({ error: 'Forbidden' }, 403)

    // Verificar se é uma meta recorrente e se precisa reiniciar
    let effectiveGoal = goal;
    if (goal.isRecurring) {
      effectiveGoal = await handleRecurringGoal(id);
    }

    const newAmount = Number(effectiveGoal.currentAmount) + amount
    const isCompleted = newAmount >= Number(effectiveGoal.targetAmount)

    // Transação para atualizar a meta e adicionar a contribuição
    const result = await db.transaction(async (tx) => {
      let updatedGoal;
      console.log('Starting transaction for contribution...')

      // Se for uma meta recorrente e for completada, verificar se deve reiniciar
      if (effectiveGoal.isRecurring && isCompleted) {
        // Reiniciar a meta com o valor original
        const originalTargetAmount = effectiveGoal.originalTargetAmount || effectiveGoal.targetAmount;

        // Calcular próxima data alvo
        const nextTargetDate = calculateNextTargetDate(new Date(), effectiveGoal.frequency);

        const [updated] = await tx
          .update(savingsGoals)
          .set({
            currentAmount: String(newAmount - Number(originalTargetAmount)), // Manter o excesso
            status: 'active',
            updatedAt: new Date(),
            nextTargetDate: nextTargetDate,
          })
          .where(eq(savingsGoals.id, id))
          .returning()

        updatedGoal = updated;
      } else {
        // Atualizar normalmente
        const [updated] = await tx
          .update(savingsGoals)
          .set({
            currentAmount: String(newAmount),
            status: isCompleted ? 'completed' : 'active',
            updatedAt: new Date(),
          })
          .where(eq(savingsGoals.id, id))
          .returning()

        updatedGoal = updated;
      }

      // Registrar a contribuição
      console.log('Inserting contribution...', { goalId: id, userId: user.id, amount: String(amount) })
      const [contribution] = await tx
        .insert(savingsContributions)
        .values({
          id: nanoid(),
          goalId: id,
          userId: user.id,
          amount: String(amount),
          notes: notes || null,
        })
        .returning()

      console.log('Contribution inserted:', contribution)

      return { updatedGoal, contribution }
    })

    // Criar notificação se for uma meta conjunta e não for o próprio usuário contribuindo
    if (goal.context === 'joint' && goal.userId !== user.id) {
      await createNotification(
        goal.userId, // Enviar para o dono da meta
        'goal_near_completion',
        'Progresso na Meta Conjunta!',
        `${user.name} contribuiu R$${amount.toFixed(2)} para "${goal.title}"`,
        { goalId: goal.id, contributorId: user.id, amount }
      )
    }

    // Notificar sobre conclusão de meta (tanto individual quanto conjunta)
    if (isCompleted && !effectiveGoal.isRecurring) {
      if (goal.context === 'joint' && goal.coupleId) {
        // Notificar ambos os membros do casal
        await notifyCouple(
          goal.coupleId,
          'goal_completed',
          'Meta Concluída!',
          `${user.name} completou a meta "${goal.title}"! Parabéns!`,
          { goalId: goal.id, completedById: user.id }
        )
      } else {
        // Notificar apenas o proprietário
        await createNotification(
          goal.userId,
          'goal_completed',
          'Meta Concluída!',
          `Parabéns! Você completou a meta "${goal.title}"!`,
          { goalId: goal.id }
        )
      }
    }

    return c.json({
      data: {
        goal: result.updatedGoal,
        contribution: result.contribution,
        completed: isCompleted
      }
    })
  }
)

export default router
