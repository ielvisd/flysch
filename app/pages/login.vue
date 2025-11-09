<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50" style="padding-top: 100px;">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center" style="background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%);">
            <UIcon name="i-heroicons-paper-airplane" class="w-10 h-10 md:w-12 md:h-12 text-white transform rotate-45" />
          </div>
        </div>
        <UBadge color="secondary" variant="soft" size="sm" class="mb-3">
          ✈️ Flysch
        </UBadge>
        <h2 class="text-3xl md:text-4xl font-bold" style="color: #004E89; font-family: var(--font-family, 'Poppins', sans-serif);">
          Welcome to Flysch 🛫
        </h2>
        <p class="mt-2" style="color: #6B7280;">
          Sign in to access your flight school matches and saved searches
        </p>
      </div>

      <UCard variant="outline" class="bg-white" style="border: 2px solid rgba(5, 74, 145, 0.4); box-shadow: 0 4px 6px rgba(5, 74, 145, 0.1);">
        <UForm :state="form" @submit="handleSubmit" class="space-y-6">
          <UFormGroup label="Email" name="email" required>
            <UInput 
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              icon="i-heroicons-envelope"
              :disabled="loading"
              style="border: 3px solid #1A659E; background-color: rgba(239, 239, 208, 0.3);"
              :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30' }"
            />
          </UFormGroup>

          <UFormGroup label="Password" name="password" required>
            <UInput 
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              :disabled="loading"
              style="border: 3px solid #1A659E; background-color: rgba(239, 239, 208, 0.3);"
              :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30' }"
            />
          </UFormGroup>

          <UButton 
            type="submit"
            block
            size="lg"
            :loading="loading"
            style="background-color: #FF6B35; color: white;"
            class="hover:opacity-90 transition-opacity min-h-[48px] font-semibold"
          >
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </UButton>
        </UForm>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span>
            </div>
          </div>

          <div class="mt-6 space-y-3">
                  <UButton 
                    variant="solid"
                    block
                    @click="demoSignIn('student')"
                    :loading="demoLoading === 'student'"
                    style="background-color: #1A659E; color: white; border: 2px solid #004E89;"
                    class="min-h-[48px] hover:opacity-90"
                  >
              <template #leading>
                <UIcon name="i-heroicons-user" class="w-5 h-5" />
              </template>
              Sign in as Demo Student
            </UButton>

                  <UButton 
                    variant="solid"
                    block
                    @click="demoSignIn('school')"
                    :loading="demoLoading === 'school'"
                    style="background-color: #1A659E; color: white; border: 2px solid #004E89;"
                    class="min-h-[48px] hover:opacity-90"
                  >
              <template #leading>
                <UIcon name="i-heroicons-building-office" class="w-5 h-5" />
              </template>
              Sign in as Demo School
            </UButton>
          </div>
        </div>

        <div class="mt-6 text-center">
            <button
            @click="isSignUp = !isSignUp"
            class="text-sm font-medium transition-opacity hover:opacity-80 min-h-[44px]"
            style="color: #004E89;"
          >
            {{ isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up' }}
          </button>
        </div>
      </UCard>

      <div class="text-center">
        <UAlert 
          color="primary"
          variant="soft"
          icon="i-heroicons-information-circle"
          title="Demo Mode"
          description="This is an MVP demo. Use the demo accounts to explore the full functionality."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSupabase } from '../composables/useSupabase'

// Meta
useHead({
  title: 'Sign In',
  meta: [
    { name: 'description', content: 'Sign in to your Flysch account' }
  ]
})

definePageMeta({
  layout: 'default'
})

// Composables
const router = useRouter()
const toast = useToast()
const supabase = ref<ReturnType<typeof useSupabase> | null>(null)

// State
const isSignUp = ref(false)
const loading = ref(false)
const demoLoading = ref<'student' | 'school' | null>(null)

const form = ref({
  email: '',
  password: ''
})

// Methods
const handleSubmit = async () => {
  if (!supabase.value) return
  
  loading.value = true

  try {
    if (isSignUp.value) {
      // Sign up
      const { data, error } = await supabase.value.auth.signUp({
        email: form.value.email,
        password: form.value.password
      })

      if (error) throw error

      toast.add({
        title: 'Account Created!',
        description: 'Please check your email to verify your account',
        color: 'success'
      })

      // Create user profile
      if (data.user) {
        await supabase.value.from('user_profiles').insert({
          id: data.user.id,
          role: 'student',
          full_name: form.value.email.split('@')[0]
        })
      }

      // Switch to sign in mode
      isSignUp.value = false
      form.value.password = ''

    } else {
      // Sign in
      const { data, error } = await supabase.value.auth.signInWithPassword({
        email: form.value.email,
        password: form.value.password
      })

      if (error) throw error

      toast.add({
        title: 'Welcome back!',
        description: 'Signed in successfully',
        color: 'success'
      })

      // Redirect to home
      router.push('/')
    }
  } catch (error: any) {
    console.error('Auth error:', error)
    toast.add({
      title: 'Authentication Error',
      description: error.message || 'Failed to authenticate',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const demoSignIn = async (type: 'student' | 'school') => {
  if (!supabase.value) return
  
  demoLoading.value = type

  try {
    const credentials = {
      student: {
        email: 'student@flysch.com',
        password: 'demo123'
      },
      school: {
        email: 'school@flysch.com',
        password: 'demo123'
      }
    }

    const { email, password } = credentials[type]

    // Try to sign in
    const { error } = await supabase.value.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // If sign in fails, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.value.auth.signUp({
        email,
        password
      })

      if (signUpError) throw signUpError

      // Create demo profile
      if (signUpData.user) {
        await supabase.value.from('user_profiles').insert({
          id: signUpData.user.id,
          role: type === 'student' ? 'student' : 'school',
          full_name: type === 'student' ? 'Demo Student' : 'Demo School'
        })
      }

      // Try signing in again
      const { error: retryError } = await supabase.value.auth.signInWithPassword({
        email,
        password
      })

      if (retryError) throw retryError
    }

    toast.add({
      title: `Signed in as Demo ${type === 'student' ? 'Student' : 'School'}`,
      description: 'Exploring in demo mode',
      color: 'success'
    })

    // Redirect to home
    router.push('/')

  } catch (error: any) {
    console.error('Demo sign in error:', error)
    toast.add({
      title: 'Demo Sign In Error',
      description: 'Please note: This MVP uses mock authentication. The demo accounts may not be fully set up yet.',
      color: 'warning'
    })
  } finally {
    demoLoading.value = null
  }
}

// Check if already signed in
onMounted(async () => {
  // Initialize Supabase client on client-side only
  supabase.value = useSupabase()
  
  const { data: { session } } = await supabase.value.auth.getSession()
  if (session) {
    router.push('/')
  }
})
</script>

