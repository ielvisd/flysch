<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navigation Bar -->
    <header 
      class="sticky top-0 z-50 shadow-xl w-full"
      style="background-color: #004E89; border-bottom: 3px solid #FF6B35; min-height: 64px;"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-3 h-16">
          <!-- Left: Logo -->
          <div class="flex items-center gap-2">
            <NuxtLink to="/" class="flex items-center gap-2 group">
              <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform" style="background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%);">
                <UIcon name="i-heroicons-paper-airplane" class="w-6 h-6 md:w-7 md:h-7 text-white transform rotate-45" />
              </div>
              <span class="text-xl md:text-2xl font-bold text-white" style="font-family: var(--font-family, 'Poppins', sans-serif);">Flysch</span>
            </NuxtLink>
          </div>

          <!-- Center: Navigation -->
          <nav class="hidden lg:flex items-center gap-1">
            <UNavigationMenu :items="navItems" />
          </nav>

          <!-- Right: Actions -->
          <div class="flex items-center gap-2">
            <!-- Dark Mode Toggle -->
            <ClientOnly>
              <UButton 
                :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                variant="ghost"
                @click="toggleDarkMode"
                aria-label="Toggle dark mode"
                class="text-white"
              />
              <template #fallback>
                <UButton 
                  icon="i-heroicons-sun"
                  variant="ghost"
                  aria-label="Toggle dark mode"
                  class="text-white"
                  disabled
                />
              </template>
            </ClientOnly>

            <!-- Auth Button -->
            <UButton 
              v-if="!user"
              to="/login"
              icon="i-heroicons-user-circle"
              size="md"
              style="background-color: #FF6B35; color: white;"
              class="hover:opacity-90 transition-opacity font-semibold"
            >
              Sign In
            </UButton>
            
            <UDropdownMenu 
              v-else
              :items="userMenuItems"
              :content="{ align: 'end', side: 'bottom' }"
            >
              <UButton 
                icon="i-heroicons-user-circle"
                trailing-icon="i-heroicons-chevron-down"
                variant="ghost"
                class="text-white"
              >
                {{ user.email }}
              </UButton>
            </UDropdownMenu>

            <!-- Mobile Menu Toggle -->
            <UButton
              icon="i-heroicons-bars-3"
              variant="ghost"
              class="lg:hidden text-white"
              @click="mobileMenuOpen = !mobileMenuOpen"
            />
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="lg:hidden border-t" style="border-color: rgba(255, 107, 53, 0.3);">
        <div class="px-4 py-4">
          <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="py-12" style="background-color: #004E89; color: #F7C59F;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%);">
                <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-white transform rotate-45" />
              </div>
              <span class="text-lg font-bold text-white" style="font-family: var(--font-family, 'Poppins', sans-serif);">Flysch</span>
            </div>
            <p class="text-sm opacity-80 max-w-md text-white">
              The student-first marketplace for finding and comparing flight schools. 
              Start your aviation journey with confidence.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-white font-semibold mb-3">Quick Links</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/" class="hover:opacity-80 transition-opacity text-white">
                  Search Schools
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/match" class="hover:opacity-80 transition-opacity text-white">
                  AI Matching
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h3 class="text-white font-semibold mb-3">Resources</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="#" class="hover:opacity-80 transition-opacity text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" class="hover:opacity-80 transition-opacity text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" class="hover:opacity-80 transition-opacity text-white">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-8 text-center text-sm opacity-60 text-white" style="border-top: 1px solid rgba(40, 175, 250, 0.2);">
          <p>&copy; {{ currentYear }} Flysch. All rights reserved. Built with Nuxt 4 + Supabase.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSupabase } from '../composables/useSupabase'

const colorMode = useColorMode()
const toast = useToast()
const router = useRouter()
const route = useRoute()

// State
const user = ref<any>(null)
const supabase = ref<ReturnType<typeof useSupabase> | null>(null)
const mobileMenuOpen = ref(false)

// Computed
const isDark = computed(() => colorMode.value === 'dark')
const currentYear = computed(() => new Date().getFullYear())

const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Search Schools',
    to: '/',
    active: route.path === '/'
  },
  {
    label: 'AI Matching',
    to: '/match',
    active: route.path.startsWith('/match')
  }
])

const userMenuItems = computed(() => [[
  {
    label: 'My Matches',
    icon: 'i-heroicons-star',
    onSelect: () => router.push('/match')
  },
  {
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    onSelect: () => {}
  }
], [
  {
    label: 'Sign Out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: handleSignOut
  }
]])

// Methods
const toggleDarkMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const handleSignOut = async () => {
  if (!supabase.value) return
  
  try {
    await supabase.value.auth.signOut()
    user.value = null
    
    toast.add({
      title: 'Signed out successfully',
      color: 'success'
    })
    
    router.push('/')
  } catch (error) {
    console.error('Sign out error:', error)
    toast.add({
      title: 'Error signing out',
      color: 'error'
    })
  }
}

// Load user session
onMounted(async () => {
  // Initialize Supabase client on client-side only
  supabase.value = useSupabase()
  
  const { data: { session } } = await supabase.value.auth.getSession()
  if (session) {
    user.value = session.user
  }

  // Listen for auth changes
  supabase.value.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
  })
})
</script>

