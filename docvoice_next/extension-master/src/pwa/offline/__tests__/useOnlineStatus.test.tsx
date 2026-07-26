import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  it('reflects navigator.onLine and reacts to events', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(typeof result.current).toBe('boolean')
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current).toBe(false)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(result.current).toBe(true)
  })
})
