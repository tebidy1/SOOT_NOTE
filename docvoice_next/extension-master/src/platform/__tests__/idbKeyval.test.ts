import { describe, it, expect } from 'vitest'
import { idbGet, idbSet, idbDel, idbKeys } from '../idbKeyval'

describe('idbKeyval', () => {
  it('round-trips a value', async () => {
    await idbSet('foo', { a: 1 })
    expect(await idbGet('foo')).toEqual({ a: 1 })
  })

  it('deletes a value', async () => {
    await idbSet('bar', 2)
    await idbDel('bar')
    expect(await idbGet('bar')).toBeUndefined()
  })

  it('lists keys', async () => {
    await idbSet('k1', 1)
    await idbSet('k2', 2)
    const keys = await idbKeys()
    expect(keys).toEqual(expect.arrayContaining(['k1', 'k2']))
  })
})
