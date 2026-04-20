import { describe, expect, it } from 'vitest'

import { getLoginErrorMessage } from './auth-errors'

describe('getLoginErrorMessage', () => {
  it('maps allowlist errors to a friendly product message', () => {
    expect(getLoginErrorMessage('Email not allowed by allowlist')).toBe(
      'This email is not allowed to access Smart Todo.',
    )
  })

  it('falls back to a generic non-technical message', () => {
    expect(getLoginErrorMessage('Unexpected upstream error')).toBe(
      'Unable to send magic link. Please check your email address and try again.',
    )
  })
})
