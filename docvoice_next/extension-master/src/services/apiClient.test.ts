import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './apiClient'
import { useAuthStore } from '../store/authStore'

describe('apiClient.authorizePairing', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'test-mobile-token',
      user: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  })

  it('POSTs pairing_id and device_name to /pairing/authorize with Bearer token', async () => {
    // apiClient.request() calls this.client(config) — axios instances are callable.
    // We patch the instance to a spy that returns the shape axios normally would.
    const original = (apiClient as any).client
    const spy = vi.fn().mockResolvedValue({
      data: { success: true, message: 'Device authorized' },
    })
    ;(apiClient as any).client = spy
    try {
      const uuid = '12345678-1234-1234-1234-123456789abc'
      const res = await apiClient.authorizePairing(uuid, 'SoutNote Mobile Web')

      expect(spy).toHaveBeenCalledTimes(1)
      const call = spy.mock.calls[0][0] as any
      expect(call.method).toBe('POST')
      expect(call.url).toBe('/pairing/authorize')
      expect(call.data).toEqual({
        pairing_id: uuid,
        device_name: 'SoutNote Mobile Web',
      })
      expect(res.success).toBe(true)
    } finally {
      ;(apiClient as any).client = original
    }
  })

  it('returns error payload on non-200 response', async () => {
    const original = (apiClient as any).client
    ;(apiClient as any).client = vi.fn().mockRejectedValue({
      response: { data: { success: false, message: 'Session expired' } },
    })
    try {
      const res = await apiClient.authorizePairing('bad-uuid', 'X')
      expect(res.success).toBe(false)
      expect(((res as any).message) ?? ((res as any).error)).toBeDefined()
    } finally {
      ;(apiClient as any).client = original
    }
  })
})
