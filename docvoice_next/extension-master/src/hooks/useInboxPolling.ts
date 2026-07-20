import { useEffect } from 'react'
import { inboxService } from '../services/inboxService'

export function useInboxPolling() {
  useEffect(() => {
    inboxService.startPolling()
    
    return () => {
      inboxService.stopPolling()
    }
  }, [])

  const refresh = () => {
    inboxService.pollInbox()
  }

  const getUnreadCount = () => {
    return inboxService.getUnreadCount()
  }

  const getNotes = () => {
    return inboxService.getNotes()
  }

  return {
    refresh,
    getUnreadCount,
    getNotes,
    isPolling: inboxService.isPollingActive()
  }
}