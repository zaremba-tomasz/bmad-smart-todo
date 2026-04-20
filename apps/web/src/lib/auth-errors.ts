export function getLoginErrorMessage(message: string | undefined): string {
  const normalized = message?.toLowerCase() ?? ''

  if (
    normalized.includes('allowlist') ||
    normalized.includes('allow list') ||
    normalized.includes('not allowed') ||
    normalized.includes('access denied')
  ) {
    return 'This email is not allowed to access Smart Todo.'
  }

  return 'Unable to send magic link. Please check your email address and try again.'
}
