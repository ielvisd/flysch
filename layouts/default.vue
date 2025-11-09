<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navigation Bar -->
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center gap-2 group">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <UIcon name="i-heroicons-paper-airplane" class="w-6 h-6 text-white transform rotate-45" />
              </div>
              <span class="text-xl font-bold text-gray-900 dark:text-white">Flysch</span>
            </NuxtLink>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-6">
            <NuxtLink 
              to="/"
              class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Search Schools
            </NuxtLink>
            <NuxtLink 
              to="/match"
              class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              AI Matching
            </NuxtLink>
            
            <!-- Dark Mode Toggle -->
            <UButton 
              :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
              variant="ghost"
              @click="toggleDarkMode"
              aria-label="Toggle dark mode"
            />

            <!-- Auth Button -->
            <UButton 
              v-if="!user"
              to="/login"
              icon="i-heroicons-user-circle"
              variant="soft"
            >
              Sign In
            </UButton>
            
            <UDropdown 
              v-else
              :items="userMenuItems"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton 
                icon="i-heroicons-user-circle"
                trailing-icon="i-heroicons-chevron-down"
                variant="ghost"
              >
                {{ user.email }}
              </UButton>
            </UDropdown>
          </div>

          <!-- Mobile Menu Button -->
          <div class="md:hidden">
            <UButton 
              icon="i-heroicons-bars-3"
              variant="ghost"
              @click="mobileMenuOpen = !mobileMenuOpen"
              aria-label="Toggle menu"
            />
          </div>
        </div>

        <!-- Mobile Menu -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-[-0.25rem]"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-[-0.25rem]"
        >
          <div v-show="mobileMenuOpen" class="md:hidden py-4 space-y-2">
            <NuxtLink 
              to="/"
              class="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              @click="mobileMenuOpen = false"
            >
              Search Schools
            </NuxtLink>
            <NuxtLink 
              to="/match"
              class="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              @click="mobileMenuOpen = false"
            >
              AI Matching
            </NuxtLink>
            
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
              <UButton 
                v-if="!user"
                to="/login"
                icon="i-heroicons-user-circle"
                variant="soft"
                class="w-full"
                @click="mobileMenuOpen = false"
              >
                Sign In
              </UButton>
              
              <div v-else class="space-y-2">
                <p class="px-3 text-sm text-gray-500 dark:text-gray-400">
                  {{ user.email }}
                </p>
                <UButton 
                  icon="i-heroicons-arrow-right-on-rectangle"
                  variant="ghost"
                  class="w-full"
                  @click="handleSignOut"
                >
                  Sign Out
                </UButton>
              </div>
            </div>
          </div>
        </Transition>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-white transform rotate-45" />
              </div>
              <span class="text-lg font-bold text-white">Flysch</span>
            </div>
            <p class="text-sm text-gray-400 max-w-md">
              The student-first marketplace for finding and comparing flight schools. 
              Start your aviation journey with confidence.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-white font-semibold mb-3">Quick Links</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/" class="hover:text-blue-400 transition-colors">
                  Search Schools
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/match" class="hover:text-blue-400 transition-colors">
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
                <a href="#" class="hover:text-blue-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; {{ currentYear }} Flysch. All rights reserved. Built with Nuxt 4 + Supabase.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const nuxtApp = useNuxtApp()
const $supabase = nuxtApp.$supabase as any // Type assertion for Supabase client
const colorMode = useColorMode()
const toast = useToast()
const router = useRouter()

// State
const mobileMenuOpen = ref(false)
const user = ref<any>(null)

// Computed
const isDark = computed(() => colorMode.value === 'dark')
const currentYear = computed(() => new Date().getFullYear())

const userMenuItems = computed(() => [[
  {
    label: 'My Matches',
    icon: 'i-heroicons-star',
    click: () => router.push('/match')
  },
  {
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => {}
  }
], [
  {
    label: 'Sign Out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: handleSignOut
  }
]])

// Methods
const toggleDarkMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const handleSignOut = async () => {
  try {
    await $supabase.auth.signOut()
    user.value = null
    mobileMenuOpen.value = false
    
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
  const { data: { session } } = await $supabase.auth.getSession()
  if (session) {
    user.value = session.user
  }

  // Listen for auth changes
  $supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
  })
})

// Close mobile menu on route change
watch(() => router.currentRoute.value.path, () => {
  mobileMenuOpen.value = false
})
</script>

