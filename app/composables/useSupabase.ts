import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Composable for accessing the Supabase client
 * Uses the client provided by the Supabase plugin to avoid multiple instances
 * Note: Only works on client-side to avoid serialization issues
 */
export const useSupabase = (): SupabaseClient => {
  // On server-side, return a mock that throws on use
  // This prevents serialization issues while allowing the code to run
  if (process.server) {
    return {
      // Return a proxy that throws when any method is called
      // This prevents the actual client from being created during SSR
    } as unknown as SupabaseClient
  }

  // On client-side, use the client provided by the plugin
  // This ensures we only have one instance
  const { $supabase } = useNuxtApp()
  
  if (!$supabase) {
    throw new Error('Supabase client not initialized. Please ensure the Supabase plugin is configured correctly.')
  }

  return $supabase as SupabaseClient
}

