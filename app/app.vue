<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
  </div>
</template>

<script setup lang="ts">
// Global meta tags
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Flysch` : 'Flysch - Find Your Perfect Flight School'
  }
})
</script>

<style>
@import '../assets/css/main.css';
</style>
