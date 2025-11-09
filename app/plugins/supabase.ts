import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin({
  name: 'supabase',
  enforce: 'pre', // Run before other plugins
  setup() {
    // Always log to verify plugin is running
    const isServer = process.server
    console.log(`[Supabase Plugin] Plugin is executing... (${isServer ? 'SERVER' : 'CLIENT'})`)
    
    const config = useRuntimeConfig()
    
    // Debug: Log the entire config to see what's available
    console.log('[Supabase Plugin] Full runtime config:', {
      public: config.public,
      hasPublic: !!config.public,
      keys: Object.keys(config.public || {}),
      allKeys: Object.keys(config || {})
    })
    
    // Get values from runtime config (set in nuxt.config.ts)
    // Try both camelCase and the actual key names
    const supabaseUrl = (config.public?.supabaseUrl || config.public?.supabase_url || '') as string
    const supabaseAnonKey = (config.public?.supabaseAnonKey || config.public?.supabase_anon_key || '') as string

    // Always log config check (not just in dev)
    console.log('[Supabase Plugin] Config check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl.length,
      keyLength: supabaseAnonKey.length,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'EMPTY',
      keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'EMPTY',
      rawUrl: config.public?.supabaseUrl,
      rawKey: config.public?.supabaseAnonKey ? 'SET' : 'NOT SET'
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      const missing = []
      if (!supabaseUrl) missing.push('SUPABASE_URL')
      if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY')
      
      console.error('[Supabase Plugin] ==========================================')
      console.error(`[Supabase Plugin] Missing environment variables: ${missing.join(', ')}`)
      console.error('[Supabase Plugin] Runtime config values:')
      console.error('  config.public:', config.public)
      console.error('  config.public.supabaseUrl:', config.public?.supabaseUrl || 'UNDEFINED')
      console.error('  config.public.supabaseAnonKey:', config.public?.supabaseAnonKey ? 'SET (hidden)' : 'UNDEFINED')
      console.error('[Supabase Plugin] Make sure your .env file contains:')
      console.error('  SUPABASE_URL=your_supabase_url')
      console.error('  SUPABASE_ANON_KEY=your_supabase_anon_key')
      console.error('[Supabase Plugin] Then restart your dev server completely (stop and start again)')
      console.error('[Supabase Plugin] ==========================================')
      
      // Return a mock client to prevent errors
      return {
        provide: {
          supabase: null as any
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

    console.log('[Supabase Plugin] ✅ Client initialized successfully!')
    console.log('[Supabase Plugin] Supabase URL:', supabaseUrl)

    return {
      provide: {
        supabase
      }
    }
  }
})
