// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/leaflet'
  ],

  typescript: {
    strict: true,
    typeCheck: true
  },

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || process.env.GROK_API_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    }
  },

  app: {
    head: {
      title: 'Flysch - Find Your Perfect Flight School',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Flysch is a student-first marketplace that helps you find, compare, and match with the perfect flight school for your aviation journey.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },


  nitro: {
    preset: 'vercel'
  }
})
