import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { users, couples, transactions, accounts, savingsGoals, recurringBills, coupleInvites } from '../db/schema'
import { eq, and, count } from 'drizzle-orm'
import { requireAuth, requireJointAccess, logAudit } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { nanoid } from 'nanoid'

const couplesRoute = new Hono()

// Schema para validação de dados de casal
const coupleUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  user1VisibleToPartner: z.boolean().optional(),
  user2VisibleToPartner: z.boolean().optional(),
})

// Schema para convite por link
const inviteLinkSchema = z.object({
  expiresAt: z.string().datetime().optional(), // Data de expiração opcional
  maxUses: z.number().int().min(1).max(10).optional(), // Limite de usos opcional
})

// Obter informações do casal
couplesRoute.get('/', requireAuth, async (c) => {
  const user = c.get('user')

  if (!user.coupleId) {
    return c.json({ error: 'User is not in a couple' }, 404)
  }

  const [couple] = await db
    .select({
      id: couples.id,
      name: couples.name,
      user1VisibleToPartner: couples.user1VisibleToPartner,
      user2VisibleToPartner: couples.user2VisibleToPartner,
      createdAt: couples.createdAt,
    })
    .from(couples)
    .where(eq(couples.id, user.coupleId))
    .limit(1)

  if (!couple) {
    return c.json({ error: 'Couple not found' }, 404)
  }

  // Pegar membros do casal
  const coupleMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.coupleId, user.coupleId))

  return c.json({
    couple: {
      ...couple,
      members: coupleMembers
    }
  })
})

// Atualizar informações do casal
couplesRoute.patch('/',
  requireAuth,
  requireJointAccess,
  rateLimit({ maxRequests: 10, windowMs: 60 * 1000, message: 'Too many couple update attempts, please try again in a minute' }),
  zValidator('json', coupleUpdateSchema),
  async (c) => {
    const user = c.get('user')
    const updates = c.req.valid('json')

    if (!user.coupleId) {
      return c.json({ error: 'User is not in a couple' }, 404)
    }

    // Obter dados atuais do casal para auditoria
    const [currentCouple] = await db
      .select({
        id: couples.id,
        name: couples.name,
        user1VisibleToPartner: couples.user1VisibleToPartner,
        user2VisibleToPartner: couples.user2VisibleToPartner,
      })
      .from(couples)
      .where(eq(couples.id, user.coupleId))
      .limit(1)

    if (!currentCouple) {
      return c.json({ error: 'Couple not found' }, 404)
    }

    // Determinar quais campos estão sendo alterados
    const oldValues: Record<string, unknown> = {}
    const newValues: Record<string, unknown> = {}

    if (updates.name !== undefined && updates.name !== currentCouple.name) {
      oldValues.name = currentCouple.name
      newValues.name = updates.name
    }
    if (updates.user1VisibleToPartner !== undefined && updates.user1VisibleToPartner !== currentCouple.user1VisibleToPartner) {
      oldValues.user1VisibleToPartner = currentCouple.user1VisibleToPartner
      newValues.user1VisibleToPartner = updates.user1VisibleToPartner
    }
    if (updates.user2VisibleToPartner !== undefined && updates.user2VisibleToPartner !== currentCouple.user2VisibleToPartner) {
      oldValues.user2VisibleToPartner = currentCouple.user2VisibleToPartner
      newValues.user2VisibleToPartner = updates.user2VisibleToPartner
    }

    // Atualizar o casal se houver alterações
    if (Object.keys(updates).length > 0) {
      await db
        .update(couples)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(couples.id, user.coupleId))
    }

    // Registrar auditoria se houve alterações reais
    if (Object.keys(oldValues).length > 0 || Object.keys(newValues).length > 0) {
      const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || null
      const userAgent = c.req.header('User-Agent') || null

      await logAudit(
        user.id,
        'couple_update',
        'couple',
        user.coupleId,
        oldValues,
        newValues,
        ipAddress,
        userAgent
      )
    }

    // Retornar dados atualizados
    const [updatedCouple] = await db
      .select({
        id: couples.id,
        name: couples.name,
        user1VisibleToPartner: couples.user1VisibleToPartner,
        user2VisibleToPartner: couples.user2VisibleToPartner,
        createdAt: couples.createdAt,
      })
      .from(couples)
      .where(eq(couples.id, user.coupleId))
      .limit(1)

    return c.json({ couple: updatedCouple })
  }
)

// Sair do casal
couplesRoute.post('/leave', requireAuth, async (c) => {
  const user = c.get('user')

  if (!user.coupleId) {
    return c.json({ error: 'User is not in a couple' }, 400)
  }

  // Obter informações do casal antes de sair para auditoria
  const [couple] = await db
    .select({
      id: couples.id,
      name: couples.name,
    })
    .from(couples)
    .where(eq(couples.id, user.coupleId))
    .limit(1)

  if (!couple) {
    return c.json({ error: 'Couple not found' }, 404)
  }

  // Pegar o outro membro do casal
  const coupleMembers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.coupleId, user.coupleId))

  // Registrar auditoria antes de sair
  const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || null
  const userAgent = c.req.header('User-Agent') || null

  await logAudit(
    user.id,
    'couple_leave',
    'couple',
    user.coupleId,
    {
      coupleName: couple.name,
      leavingUser: { id: user.id, name: user.name, email: user.email },
      remainingMembers: coupleMembers.filter(m => m.id !== user.id)
    },
    null,
    ipAddress,
    userAgent
  )

  // Remover usuário do casal
  await db
    .update(users)
    .set({ coupleId: null, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return c.json({ message: 'Successfully left the couple' })
})

// Dissolver o casal (apenas se for o último membro ou se ambos concordarem)
couplesRoute.delete('/',
  requireAuth,
  requireJointAccess,
  rateLimit({ maxRequests: 5, windowMs: 60 * 1000, message: 'Too many couple dissolution attempts, please try again in a minute' }),
  async (c) => {
    const user = c.get('user')

    if (!user.coupleId) {
      return c.json({ error: 'User is not in a couple' }, 400)
    }

    // Obter informações do casal
    const [couple] = await db
      .select({
        id: couples.id,
        name: couples.name,
        createdAt: couples.createdAt,
      })
      .from(couples)
      .where(eq(couples.id, user.coupleId))
      .limit(1)

    if (!couple) {
      return c.json({ error: 'Couple not found' }, 404)
    }

    // Verificar quantos membros estão no casal
    const coupleMembers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.coupleId, user.coupleId))

    // Permitir dissolução se for o último membro ou se ambos concordarem
    if (coupleMembers.length > 1) {
      return c.json({ error: 'Cannot dissolve couple with multiple members. Both partners must leave individually first.' }, 400)
    }

    // Registrar auditoria antes de dissolver
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || null
    const userAgent = c.req.header('User-Agent') || null

    await logAudit(
      user.id,
      'couple_dissolve',
      'couple',
      user.coupleId,
      {
        coupleName: couple.name,
        dissolvedBy: { id: user.id, name: user.name, email: user.email },
        membersCount: coupleMembers.length,
        createdAt: couple.createdAt
      },
      null,
      ipAddress,
      userAgent
    )

    // Remover o casal e todos os dados associados (transações, contas, metas, etc.)
    // As relações cascade no banco cuidarão da maioria dos dados

    // Primeiro, remover usuários do casal
    await db
      .update(users)
      .set({ coupleId: null, updatedAt: new Date() })
      .where(eq(users.coupleId, user.coupleId))

    // Depois, remover o casal
    await db.delete(couples).where(eq(couples.id, user.coupleId))

    return c.json({ message: 'Successfully dissolved the couple and removed all associated data' })
  }
)

// Gerar convite por link
couplesRoute.post('/invite-link',
  requireAuth,
  requireJointAccess,
  rateLimit({ maxRequests: 5, windowMs: 60 * 1000, message: 'Too many invite link requests, please try again in a minute' }),
  zValidator('json', inviteLinkSchema),
  async (c) => {
    const user = c.get('user')
    const { expiresAt, maxUses } = c.req.valid('json')

    if (!user.coupleId) {
      return c.json({ error: 'User is not in a couple' }, 400)
    }

    // Verificar se o usuário já tem um convite ativo
    const existingInvite = await db.query.coupleInvites.findFirst({
      where: (invite, { eq, and, gt }) =>
        and(
          eq(invite.coupleId, user.coupleId),
          eq(invite.isActive, true),
          gt(invite.expiresAt, new Date()) // Ainda não expirou
        )
    })

    if (existingInvite) {
      return c.json({ error: 'An active invite link already exists. Please revoke it first or wait for expiration.' }, 409)
    }

    // Gerar token único para o convite
    const inviteToken = nanoid(32)
    const linkExpiresAt = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias padrão

    const [invite] = await db
      .insert(coupleInvites)
      .values({
        id: nanoid(),
        coupleId: user.coupleId,
        token: inviteToken,
        createdBy: user.id,
        expiresAt: linkExpiresAt,
        maxUses: maxUses || 2, // Valor padrão de 2 usos
        currentUses: 0,
        isActive: true,
      })
      .returning()

    // Registrar auditoria
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || null
    const userAgent = c.req.header('User-Agent') || null

    await logAudit(
      user.id,
      'couple_invite_link_create',
      'couple_invite',
      invite.id,
      null,
      {
        coupleId: user.coupleId,
        expiresAt: linkExpiresAt,
        maxUses: maxUses || 2,
        inviteToken: inviteToken.substring(0, 8) + '...' // Mostrar apenas parte do token por segurança
      },
      ipAddress,
      userAgent
    )

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const inviteLink = `${frontendUrl}/join-couple?token=${inviteToken}`

    return c.json({
      inviteLink,
      expiresAt: linkExpiresAt,
      maxUses: maxUses || 2,
      tokenPreview: inviteToken.substring(0, 8) + '...'
    })
  }
)

// Revogar convite por link
couplesRoute.delete('/invite-link',
  requireAuth,
  requireJointAccess,
  async (c) => {
    const user = c.get('user')

    if (!user.coupleId) {
      return c.json({ error: 'User is not in a couple' }, 400)
    }

    // Encontrar convite ativo para este casal
    const invite = await db.query.coupleInvites.findFirst({
      where: (invite, { eq, and, gt }) =>
        and(
          eq(invite.coupleId, user.coupleId),
          eq(invite.isActive, true),
          gt(invite.expiresAt, new Date()) // Ainda não expirou
        )
    })

    if (!invite) {
      return c.json({ error: 'No active invite link found for this couple' }, 404)
    }

    // Marcar convite como inativo
    await db
      .update(coupleInvites)
      .set({ isActive: false, revokedAt: new Date(), revokedBy: user.id })
      .where(eq(coupleInvites.id, invite.id))

    // Registrar auditoria
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || null
    const userAgent = c.req.header('User-Agent') || null

    await logAudit(
      user.id,
      'couple_invite_link_revoke',
      'couple_invite',
      invite.id,
      {
        coupleId: user.coupleId,
        tokenPreview: invite.token.substring(0, 8) + '...',
        expiresAt: invite.expiresAt,
        currentUses: invite.currentUses,
        maxUses: invite.maxUses
      },
      null,
      ipAddress,
      userAgent
    )

    return c.json({ message: 'Invite link revoked successfully' })
  }
)

// Aceitar convite por link
couplesRoute.post('/accept-invite',
  requireAuth,
  zValidator('json', z.object({
    token: z.string().min(10), // Token do convite
  })),
  async (c) => {
    const user = c.get('user')
    const { token } = c.req.valid('json')

    // Verificar se o usuário já está em um casal
    if (user.coupleId) {
      return c.json({ error: 'User is already in a couple' }, 409)
    }

    // Encontrar convite com base no token
    const invite = await db.query.coupleInvites.findFirst({
      where: (invite, { eq, and, gt }) =>
        and(
          eq(invite.token, token),
          eq(invite.isActive, true),
          gt(invite.expiresAt, new Date()), // Não expirado
          gt(invite.maxUses, invite.currentUses) // Ainda tem usos disponíveis
        )
    })

    if (!invite) {
      return c.json({ error: 'Invalid or expired invite token' }, 404)
    }

    // Verificar se o casal já está cheio
    const coupleMembers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.coupleId, invite.coupleId))

    if (coupleMembers.length >= 2) {
      return c.json({ error: 'Couple is already full' }, 409)
    }

    // Atualizar contador de usos do convite
    await db
      .update(coupleInvites)
      .set({ currentUses: invite.currentUses + 1 })
      .where(eq(coupleInvites.id, invite.id))

    // Adicionar usuário ao casal
    await db
      .update(users)
      .set({ coupleId: invite.coupleId, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    // Obter informações atualizadas do casal
    const [couple] = await db
      .select({
        id: couples.id,
        name: couples.name,
      })
      .from(couples)
      .where(eq(couples.id, invite.coupleId))
      .limit(1)

    // Registrar auditoria
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || null
    const userAgent = c.req.header('User-Agent') || null

    await logAudit(
      user.id,
      'couple_join_via_invite',
      'couple',
      invite.coupleId,
      null,
      {
        invitedBy: invite.createdBy,
        inviteToken: token.substring(0, 8) + '...',
        coupleName: couple?.name || 'Unknown Couple'
      },
      ipAddress,
      userAgent
    )

    return c.json({
      message: 'Successfully joined the couple',
      couple: { id: couple?.id, name: couple?.name }
    })
  }
)

export default couplesRoute