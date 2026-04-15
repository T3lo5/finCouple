import { useState, useCallback } from 'react'
import { couplesApi, type Couple, type CoupleInviteLink } from '../lib/api'
import { useAuth } from './useAuth'

export interface UseCouplesOptions {
  autoFetch?: boolean
}

export function useCouples({ autoFetch = true }: UseCouplesOptions = {}) {
  const { user, loading: authLoading } = useAuth()
  const [couple, setCouple] = useState<Couple | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCouple = useCallback(async () => {
    if (!user?.coupleId) {
      setCouple(null)
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.get()
      setCouple(response.couple)
      return response.couple
    } catch (err: any) {
      setError(err.message || 'Failed to fetch couple')
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.coupleId])

  const updateCouple = useCallback(async (updates: Partial<{
    name: string
    user1VisibleToPartner: boolean
    user2VisibleToPartner: boolean
  }>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.update(updates)
      setCouple(response.couple)
      return response.couple
    } catch (err: any) {
      setError(err.message || 'Failed to update couple')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const leaveCouple = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.leave()
      setCouple(null)
      // O hook useAuth deve lidar com a atualização do user.coupleId
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to leave couple')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const dissolveCouple = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.dissolve()
      setCouple(null)
      // O hook useAuth deve lidar com a atualização do user.coupleId
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to dissolve couple')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createInviteLink = useCallback(async (params?: {
    expiresAt?: string
    maxUses?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.createInviteLink(params || {})
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to create invite link')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const revokeInviteLink = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.revokeInviteLink()
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invite link')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const acceptInvite = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await couplesApi.acceptInvite(token)
      // Atualizar o estado do casal após aceitar o convite
      await fetchCouple()
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite')
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchCouple])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    couple,
    loading: loading || (autoFetch && authLoading),
    error,
    fetchCouple,
    updateCouple,
    leaveCouple,
    dissolveCouple,
    createInviteLink,
    revokeInviteLink,
    acceptInvite,
    clearError,
  }
}