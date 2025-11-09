<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
  </UApp>
</template>

<script setup lang="ts">
// Global meta tags
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Flysch` : 'Flysch - Find Your Perfect Flight School'
  }
})
</script>

