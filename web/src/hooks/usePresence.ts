import { useState, useEffect, useCallback } from 'react'
// TODO: Remove Prisma import - should use API routes instead
import { useAuth } from '../contexts/AuthContext'
import { UserStatus } from '@prisma/client'

export interface UserPresence {
  userId: string
  userName: string
  userAvatar?: string
  status: UserStatus
  lastSeen: string
  isOnline: boolean
}

export interface PresenceState {
  [key: string]: UserPresence[]
}

export const usePresence = (companyId?: string) => {
  const { user } = useAuth()
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [isTracking, setIsTracking] = useState(false)

  // Update user's presence status
  const updatePresence = useCallback(async (status: UserStatus, message?: string) => {
    if (!user || !companyId) return

    try {
      // TODO: Replace with API call instead of direct Prisma usage
      console.log('Update presence needs to be implemented with API routes')

      // Refresh presence data
      await loadPresenceData()
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }, [user, companyId])

  // Load presence data for the company
  const loadPresenceData = useCallback(async () => {
    if (!companyId) return

    try {
      // TODO: Replace with API call instead of direct Prisma usage
      console.log('Load presence data needs to be implemented with API routes')
      const presences: any[] = []

      const users: UserPresence[] = presences.map(presence => ({
        userId: presence.user.id,
        userName: presence.user.fullName || presence.user.email.split('@')[0],
        userAvatar: presence.user.avatar,
        status: presence.status,
        lastSeen: presence.lastSeen.toISOString(),
        isOnline: presence.isOnline
      }))

      setOnlineUsers(users)
      
      // Group by status
      const groupedState: PresenceState = {}
      users.forEach(user => {
        if (!groupedState[user.status]) {
          groupedState[user.status] = []
        }
        groupedState[user.status].push(user)
      })
      
      setPresenceState(groupedState)
    } catch (error) {
      console.error('Error loading presence data:', error)
    }
  }, [companyId])

  // Start tracking presence
  const startTracking = useCallback(async () => {
    if (!user || !companyId || isTracking) return

    try {
      // Set user as available
      await updatePresence('AVAILABLE')
      setIsTracking(true)
      
      // Load initial presence data
      await loadPresenceData()
      
      // Set up periodic refresh
      const interval = setInterval(loadPresenceData, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error starting presence tracking:', error)
      return null
    }
  }, [user, companyId, isTracking, updatePresence, loadPresenceData])

  // Stop tracking presence
  const stopTracking = useCallback(async () => {
    if (!user || !companyId) return

    try {
      // TODO: Replace with API call instead of direct Prisma usage
      console.log('Set user offline needs to be implemented with API routes')

      setIsTracking(false)
      setPresenceState({})
      setOnlineUsers([])
    } catch (error) {
      console.error('Error stopping presence tracking:', error)
    }
  }, [user, companyId])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('AWAY')
      } else {
        updatePresence('AVAILABLE')
      }
    }

    const handleBeforeUnload = () => {
      updatePresence('OFFLINE')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [updatePresence])

  // Auto-start tracking when user and company are available
  useEffect(() => {
    if (user && companyId && !isTracking) {
      startTracking()
    }

    return () => {
      if (isTracking) {
        stopTracking()
      }
    }
  }, [user, companyId, isTracking, startTracking, stopTracking])

  // Get user status by ID
  const getUserStatus = useCallback((userId: string): UserStatus => {
    const userPresence = onlineUsers.find(u => u.userId === userId)
    return userPresence?.status || 'OFFLINE'
  }, [onlineUsers])

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    const status = getUserStatus(userId)
    return status !== 'OFFLINE'
  }, [getUserStatus])

  // Get online user count (all statuses except offline)
  const onlineCount = onlineUsers.filter(u => u.status !== 'OFFLINE').length

  return {
    presenceState,
    onlineUsers,
    onlineCount,
    isTracking,
    updatePresence,
    startTracking,
    stopTracking,
    getUserStatus,
    isUserOnline
  }
}