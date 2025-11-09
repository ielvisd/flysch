<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="text-center">
      <div class="flex justify-center mb-8">
        <div class="relative">
          <div class="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center animate-pulse">
            <UIcon name="i-heroicons-paper-airplane" class="w-16 h-16 text-white transform rotate-45" />
          </div>
          <div class="absolute -top-2 -right-2">
            <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">
        404
      </h1>
      
      <h2 class="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Flight Path Not Found
      </h2>
      
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Looks like you've flown off course! The page you're looking for doesn't exist or has been moved to a different runway.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton 
          to="/"
          size="lg"
          icon="i-heroicons-home"
        >
          Return to Home
        </UButton>
        
        <UButton 
          to="/match"
          size="lg"
          variant="outline"
          icon="i-heroicons-magnifying-glass"
        >
          Find Flight Schools
        </UButton>
      </div>

      <div class="mt-12">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Common destinations:
        </p>
        <div class="flex flex-wrap gap-2 justify-center">
          <NuxtLink 
            to="/"
            class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Search Schools
          </NuxtLink>
          <NuxtLink 
            to="/match"
            class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            AI Matching
          </NuxtLink>
          <NuxtLink 
            to="/login"
            class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Sign In
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
useHead({
  title: '404 - Page Not Found',
  meta: [
    { name: 'description', content: 'The page you are looking for could not be found.' }
  ]
})

definePageMeta({
  layout: 'default'
})
</script>

