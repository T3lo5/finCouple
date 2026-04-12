import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { users, sessions, couples, passwordResetTokens } from '../db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireAuth } from '../middleware/auth'
import Brevo from '@getbrevo/brevo'

const auth = new Hono()

// Initialize Brevo API client
const brevoApi = new Brevo.TransactionalEmailsApi()
brevoApi.setApiKey(process.env.BREVO_API_KEY || '')

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.PASSWORD_SALT)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('hex')
}

function createSessionToken(): string {
  return nanoid(64)
}

function createResetToken(): string {
  return nanoid(32)
}

async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
  
  const sendSmtpEmail = new Brevo.SendSmtpEmail()
  sendSmtpEmail.subject = 'Recuperação de Senha - FinCouple'
  sendSmtpEmail.sender = { name: 'FinCouple', email: process.env.BREVO_SENDER_EMAIL || 'noreply@fincouple.com' }
  sendSmtpEmail.to = [{ email, name: '' }]
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'DM Sans', sans-serif; background-color: #08080A; color: #F9FAFB; margin: 0; padding: 20px; }
          .container { max-width: 400px; margin: 0 auto; background-color: #141417; border-radius: 24px; padding: 32px; border: 1px solid rgba(255, 255, 255, 0.05); }
          .logo { text-align: center; margin-bottom: 24px; }
          h1 { font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 24px; margin-bottom: 16px; }
          p { color: #82828C; line-height: 1.6; margin-bottom: 24px; }
          .button { display: inline-block; background-color: #D4AF37; color: #08080A; text-decoration: none; padding: 14px 32px; border-radius: 20px; font-weight: 600; margin: 16px 0; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #82828C; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>FinCouple</h1>
          </div>
          <p>Você solicitou a recuperação de senha da sua conta FinCouple.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; font-size: 12px; color: #82828C;">${resetUrl}</p>
          <p>Este link é válido por 1 hora.</p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
          <div class="footer">
            © 2024 FinCouple. Todos os direitos reservados.
          </div>
        </div>
      </body>
    </html>
  `
  sendSmtpEmail.tags = ['password-reset']

  try {
    await brevoApi.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send email')
  }
}

auth.post('/register',
  zValidator('json', z.object({
    email:    z.string().email(),
    name:     z.string().min(2).max(80),
    password: z.string().min(8),
  })),
  async (c) => {
    const { email, name, password } = c.req.valid('json')

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existing) {
      return c.json({ error: 'Email already registered' }, 409)
    }

    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({ email: email.toLowerCase(), name, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email })

    const token = createSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 

    await db.insert(sessions).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
    })

    c.header('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)

    return c.json({ user, token }, 201)
  }
)

auth.post('/login',
  zValidator('json', z.object({
    email:    z.string().email(),
    password: z.string(),
  })),
  async (c) => {
    const { email, password } = c.req.valid('json')

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = createSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.insert(sessions).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
    })

    c.header('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)

    return c.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, coupleId: user.coupleId }
    })
  }
)

auth.post('/logout', requireAuth, async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token))
  }
  c.header('Set-Cookie', 'session_token=; HttpOnly; Path=/; Max-Age=0')
  return c.json({ ok: true })
})

auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// Request password reset
auth.post('/forgot-password',
  zValidator('json', z.object({
    email: z.string().email(),
  })),
  async (c) => {
    const { email } = c.req.valid('json')

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      // Don't reveal if email exists or not for security
      return c.json({ message: 'If the email is registered, you will receive a password reset link' })
    }

    // Invalidate any existing reset tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.used, false)
      ))

    // Create new reset token
    const token = createResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.insert(passwordResetTokens).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
      used: false,
    })

    // Send email
    try {
      await sendPasswordResetEmail(user.email, token)
      return c.json({ message: 'If the email is registered, you will receive a password reset link' })
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return c.json({ error: 'Failed to send email. Please try again later.' }, 500)
    }
  }
)

// Reset password with token
auth.post('/reset-password',
  zValidator('json', z.object({
    token: z.string(),
    newPassword: z.string().min(8),
  })),
  async (c) => {
    const { token, newPassword } = c.req.valid('json')

    // Find valid reset token
    const [resetToken] = await db
      .select({ 
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        used: passwordResetTokens.used
      })
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1)

    if (!resetToken) {
      return c.json({ error: 'Invalid or expired reset token' }, 400)
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId))

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id))

    // Invalidate all sessions for this user (optional security measure)
    await db
      .delete(sessions)
      .where(eq(sessions.userId, resetToken.userId))

    return c.json({ message: 'Password successfully reset. Please login with your new password.' })
  }
)

auth.post('/couple/create', requireAuth, async (c) => {
  const user = c.get('user')

  if (user.coupleId) {
    return c.json({ error: 'Already in a couple' }, 409)
  }

  const inviteCode = nanoid(10)

  const [couple] = await db
    .insert(couples)
    .values({ inviteCode })
    .returning()

  await db
    .update(users)
    .set({ coupleId: couple.id, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return c.json({ couple })
})

auth.post('/couple/join',
  requireAuth,
  zValidator('json', z.object({ inviteCode: z.string() })),
  async (c) => {
    const user = c.get('user')
    const { inviteCode } = c.req.valid('json')

    if (user.coupleId) {
      return c.json({ error: 'Already in a couple' }, 409)
    }

    const [couple] = await db
      .select()
      .from(couples)
      .where(eq(couples.inviteCode, inviteCode))
      .limit(1)

    if (!couple) {
      return c.json({ error: 'Invalid invite code' }, 404)
    }

    const members = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.coupleId, couple.id))

    if (members.length >= 2) {
      return c.json({ error: 'Couple is full' }, 409)
    }

    await db
      .update(users)
      .set({ coupleId: couple.id, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return c.json({ couple })
  }
)

// Update user profile
auth.patch('/profile',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    password: z.string().min(8).optional(), // Required for critical changes
  })),
  async (c) => {
    const user = c.get('user')
    const updates = c.req.valid('json')

    // Check if critical changes require password confirmation
    const isCriticalChange = updates.email || updates.password
    if (isCriticalChange && !updates.password) {
      return c.json({ error: 'Password confirmation required for critical changes' }, 403)
    }

    // Verify password for critical changes
    if (isCriticalChange && updates.password) {
      const hash = await hashPassword(updates.password)
      if (hash !== user.passwordHash) {
        return c.json({ error: 'Invalid password' }, 401)
      }
      // Remove password from updates (it's only for confirmation)
      delete updates.password
    }

    // Check if email is being changed and if it's already in use
    if (updates.email && updates.email !== user.email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, updates.email.toLowerCase()))
        .limit(1)

      if (existing) {
        return c.json({ error: 'Email already in use' }, 409)
      }
      
      updates.email = updates.email.toLowerCase()
    }

    // Remove empty avatarUrl
    if (updates.avatarUrl === '') {
      delete updates.avatarUrl
    }

    // Update user if there are any changes
    if (Object.keys(updates).length > 0) {
      await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, user.id))
    }

    // Fetch updated user data
    const [updatedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        coupleId: users.coupleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    return c.json({ data: { user: updatedUser } })
  }
)

// Delete user account
auth.delete('/account',
  requireAuth,
  zValidator('json', z.object({
    password: z.string().min(8),
  })),
  async (c) => {
    const user = c.get('user')
    const { password } = c.req.valid('json')

    // Verify password before deletion
    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    // Soft delete - mark sessions for cleanup and delete user
    // First, invalidate all sessions
    await db.delete(sessions).where(eq(sessions.userId, user.id))

    // Delete user (cascade will handle related data)
    await db.delete(users).where(eq(users.id, user.id))

    c.header('Set-Cookie', 'session_token=; HttpOnly; Path=/; Max-Age=0')

    return c.json({ message: 'Account deleted successfully' })
  }
)

export default auth
