import { useState, useEffect, useCallback } from 'react'
import { notificationsApi, type Notification } from '../lib/api'

interface UseNotificationsOptions {
  autoFetch?: boolean
  pollInterval?: number // em ms, para polling de novas notificações
}

export function useNotifications({ autoFetch = true, pollInterval = 30000 }: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const [notificationsRes, unreadRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.getUnreadCount(),
      ])
      
      setNotifications(notificationsRes.data)
      setUnreadCount(unreadRes.data.unreadCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications()
      
      // Polling para atualizar contador de não lidas
      const interval = setInterval(() => {
        notificationsApi.getUnreadCount()
          .then(res => setUnreadCount(res.data.unreadCount))
          .catch(console.error)
      }, pollInterval)
      
      return () => clearInterval(interval)
    }
  }, [fetchNotifications, autoFetch, pollInterval])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
