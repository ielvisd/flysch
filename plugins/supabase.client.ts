import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl || ''
  const supabaseAnonKey = config.public.supabaseAnonKey || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.')
    // Return a mock client to prevent errors
    return {
      provide: {
        supabase: null
      }
    }
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return {
    provide: {
      supabase
    }
  }
})

