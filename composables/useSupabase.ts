import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Composable for accessing the Supabase client
 * Creates a singleton instance using runtime config
 * Note: Only creates client on client-side to avoid serialization issues
 */
export const useSupabase = (): SupabaseClient => {
  const config = useRuntimeConfig()
  
  // Get values from runtime config
  const supabaseUrl = config.public.supabaseUrl || ''
  const supabaseAnonKey = config.public.supabaseAnonKey || ''

  // Use useState to create a singleton instance, but only initialize on client-side
  // This prevents serialization issues during SSR
  const supabaseClient = useState<SupabaseClient | null>('supabase-client', () => {
    // Only create client on client-side
    if (process.server) {
      return null
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[useSupabase] Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.')
      return null
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  })

  // On server-side, return a mock that throws on use
  // This prevents serialization issues while allowing the code to run
  if (process.server) {
    return {
      // Return a proxy that throws when any method is called
      // This prevents the actual client from being created during SSR
    } as unknown as SupabaseClient
  }

  // On client-side, ensure client is initialized
  if (!supabaseClient.value) {
    // Try to initialize if not already done
    if (supabaseUrl && supabaseAnonKey) {
      supabaseClient.value = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    } else {
      throw new Error('Supabase client not initialized. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.')
    }
  }

  return supabaseClient.value
}

