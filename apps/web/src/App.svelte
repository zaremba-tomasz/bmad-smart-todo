<script lang="ts">
  import { getLoginErrorMessage } from '$lib/auth-errors'
  import { authStore } from '$lib/stores/auth-store.svelte'

  authStore.init()

  let email = $state('')
  let errorMessage = $state('')
  let linkSent = $state(false)
  let submitting = $state(false)

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault()
    errorMessage = ''
    linkSent = false

    const trimmed = email.trim()
    if (!trimmed) {
      errorMessage = 'Please enter your email address.'
      return
    }

    submitting = true
    const { error } = await authStore.signIn(trimmed)
    submitting = false

    if (error) {
      errorMessage = getLoginErrorMessage(error.message)
      return
    }

    linkSent = true
  }

  async function handleLogout() {
    await authStore.signOut()
  }
</script>

{#if authStore.loading}
  <main class="flex min-h-screen items-center justify-center">
    <p class="text-text-secondary">Loading…</p>
  </main>
{:else if authStore.user}
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-text-primary">Smart Todo</h1>
      <p class="mt-2 text-text-secondary">Welcome, {authStore.user.email}</p>
    </div>
    <button
      type="button"
      onclick={handleLogout}
      class="rounded-lg border border-border-default px-6 py-3 text-text-secondary transition-colors hover:border-border-focus hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
    >
      Sign out
    </button>
  </main>
{:else}
  <main class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <h1 class="mb-6 text-center text-2xl font-semibold text-text-primary">Smart Todo</h1>

      {#if linkSent}
        <div class="rounded-lg bg-surface-raised p-6 text-center shadow-sm">
          <p class="text-[length:var(--font-size-loud)] font-[number:var(--font-weight-loud)] leading-[var(--line-height-loud)] text-text-primary">
            Check your email
          </p>
          <p class="mt-2 text-[length:var(--font-size-quiet)] text-text-secondary">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in.
          </p>
          <button
            type="button"
            onclick={() => { linkSent = false; errorMessage = '' }}
            class="mt-4 text-[length:var(--font-size-quiet)] text-text-secondary underline hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
          >
            Use a different email
          </button>
        </div>
      {:else}
        <form onsubmit={handleLogin} class="rounded-lg bg-surface-raised p-6 shadow-sm" novalidate>
          <div class="mb-4">
            <label
              for="email"
              class="mb-1 block text-[length:var(--font-size-quiet)] font-[number:var(--font-weight-quiet)] leading-[var(--line-height-quiet)] text-text-secondary"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              autocomplete="email"
              required
              class="w-full rounded-lg border px-4 py-3 text-[length:var(--font-size-input)] font-[number:var(--font-weight-input)] leading-[var(--line-height-input)] text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 {errorMessage ? 'border-coral-500' : 'border-border-default'}"
            />
            {#if errorMessage}
              <p class="mt-1 text-[length:var(--font-size-quiet)] text-coral-500" role="alert">
                {errorMessage}
              </p>
            {/if}
          </div>

          <button
            type="submit"
            disabled={submitting}
            class="w-full rounded-lg bg-coral-500 px-6 py-3 text-[length:var(--font-size-loud)] font-[number:var(--font-weight-loud)] text-white transition-colors hover:bg-coral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      {/if}
    </div>
  </main>
{/if}
