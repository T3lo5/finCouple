import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { db } from '../db/client'
import { pushNotifications, pushSubscriptions, users } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

const router = new Hono()
router.use(requireAuth)

// Schema para criar notificação (admin/internal use)
const createNotificationSchema = z.object({
  userId: z.string().optional(),
  type: z.enum(['bill_reminder', 'goal_completed', 'goal_near_completion', 'budget_alert', 'couple_invite', 'general']),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  data: z.record(z.any()).optional(),
})

// Schema para registrar subscription de push
const subscriptionKeysSchema = z.object({
  p256dh: z.string(),
  auth: z.string(),
})

const registerSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: subscriptionKeysSchema,
  userAgent: z.string().optional(),
})

// GET /notifications - Listar notificações do usuário
router.get('/', async (c) => {
  const user = c.get('user')
  
  try {
    const notifications = await db.query.pushNotifications.findMany({
      where: eq(pushNotifications.userId, user.id),
      orderBy: [desc(pushNotifications.createdAt)],
      limit: 50,
    })
    
    return c.json({ data: notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return c.json({ error: 'Failed to fetch notifications' }, 500)
  }
})

// GET /notifications/unread - Contar não lidas
router.get('/unread', async (c) => {
  const user = c.get('user')
  
  try {
    const notifications = await db.query.pushNotifications.findMany({
      where: eq(pushNotifications.userId, user.id),
    })
    
    const unreadCount = notifications.filter(n => !n.read).length
    
    return c.json({ data: { unreadCount } })
  } catch (error) {
    console.error('Error counting unread notifications:', error)
    return c.json({ error: 'Failed to count unread notifications' }, 500)
  }
})

// PATCH /notifications/:id/read - Marcar como lida
router.patch('/:id/read', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  
  try {
    const notification = await db.query.pushNotifications.findFirst({
      where: eq(pushNotifications.id, id),
    })
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404)
    }
    
    if (notification.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    await db.update(pushNotifications)
      .set({ read: true })
      .where(eq(pushNotifications.id, id))
    
    return c.json({ data: { success: true } })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return c.json({ error: 'Failed to mark notification as read' }, 500)
  }
})

// PATCH /notifications/read-all - Marcar todas como lidas
router.patch('/read-all', async (c) => {
  const user = c.get('user')
  
  try {
    await db.update(pushNotifications)
      .set({ read: true })
      .where(eq(pushNotifications.userId, user.id))
    
    return c.json({ data: { success: true } })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return c.json({ error: 'Failed to mark all notifications as read' }, 500)
  }
})

// POST /notifications/subscribe - Registrar subscription para push
router.post('/subscribe', zValidator('json', registerSubscriptionSchema), async (c) => {
  const user = c.get('user')
  const { endpoint, keys, userAgent } = c.req.valid('json')
  
  try {
    // Verificar se já existe subscription com este endpoint
    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, endpoint),
    })
    
    if (existing) {
      // Atualizar subscription existente
      await db.update(pushSubscriptions)
        .set({
          keys: JSON.stringify(keys),
          userAgent: userAgent || existing.userAgent,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing.id))
      
      return c.json({ data: { id: existing.id, updated: true } })
    }
    
    // Criar nova subscription
    const result = await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint,
      keys: JSON.stringify(keys),
      userAgent,
    }).returning()
    
    return c.json({ data: { id: result[0].id, created: true } }, 201)
  } catch (error) {
    console.error('Error registering subscription:', error)
    return c.json({ error: 'Failed to register subscription' }, 500)
  }
})

// DELETE /notifications/subscribe/:id - Remover subscription
router.delete('/subscribe/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  
  try {
    const subscription = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.id, id),
    })
    
    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404)
    }
    
    if (subscription.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))
    
    return c.json({ data: { success: true } })
  } catch (error) {
    console.error('Error removing subscription:', error)
    return c.json({ error: 'Failed to remove subscription' }, 500)
  }
})

// GET /notifications/subscriptions - Listar subscriptions do usuário
router.get('/subscriptions', async (c) => {
  const user = c.get('user')
  
  try {
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, user.id),
    })
    
    // Não retornar as chaves completas por segurança
    const sanitized = subscriptions.map(s => ({
      id: s.id,
      endpoint: s.endpoint,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))
    
    return c.json({ data: sanitized })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return c.json({ error: 'Failed to fetch subscriptions' }, 500)
  }
})

// Função utilitária para criar notificação (exportada para uso em outras rotas)
export async function createNotification(
  userId: string,
  type: 'bill_reminder' | 'goal_completed' | 'goal_near_completion' | 'budget_alert' | 'couple_invite' | 'general',
  title: string,
  message: string,
  data?: Record<string, any>
) {
  try {
    await db.insert(pushNotifications).values({
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// Função para notificar ambos os membros do casal
export async function notifyCouple(
  coupleId: string,
  type: 'bill_reminder' | 'goal_completed' | 'goal_near_completion' | 'budget_alert' | 'couple_invite' | 'general',
  title: string,
  message: string,
  data?: Record<string, any>
) {
  try {
    const members = await db.query.users.findMany({
      where: eq(users.coupleId, coupleId),
    })
    
    for (const member of members) {
      await createNotification(member.id, type, title, message, data)
    }
  } catch (error) {
    console.error('Error notifying couple:', error)
  }
}

export default router
