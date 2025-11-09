import { vi } from 'vitest'

// Create a proper useState mock that returns a ref-like object
const createState = (init?: () => any) => {
  const value = init ? init() : null
  return { value }
}

// Import Vue's computed for mocking
import { computed as vueComputed } from 'vue'

// Mock Nuxt auto-imported composables as global functions
global.useToast = vi.fn(() => ({
  add: vi.fn()
}))

global.useState = vi.fn((key: string, init?: () => any) => createState(init))

global.useGeolocation = vi.fn(() => ({
  coords: { value: null },
  error: { value: null }
}))

// Mock Vue's computed (auto-imported in Nuxt)
global.computed = vueComputed

// Mock $fetch
global.$fetch = vi.fn()

// Mock process.client for localStorage tests
if (typeof process !== 'undefined') {
  process.client = true
} else {
  (global as any).process = { client: true }
}

// Type declarations for TypeScript
declare global {
  function useToast(): { add: (options: any) => void }
  function useState<T>(key: string, init?: () => T): { value: T }
  function useGeolocation(): { coords: { value: any }, error: { value: any } }
  function computed<T>(fn: () => T): { value: T }
  const $fetch: typeof vi.fn
}

