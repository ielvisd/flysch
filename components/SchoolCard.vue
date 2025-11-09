<template>
  <UCard 
    class="school-card cursor-pointer hover:shadow-lg transition-all duration-200"
    @click="navigateToSchool"
  >
    <template #header>
      <div class="flex justify-between items-start gap-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ school.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
            {{ school.city }}, {{ school.state }}
          </p>
        </div>
        
        <UBadge 
          :color="tierColor"
          variant="subtle"
          size="xs"
          class="shrink-0"
        >
          {{ school.trust_tier }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <!-- Programs -->
      <div v-if="school.programs && school.programs.length > 0">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Programs Offered</p>
        <div class="flex flex-wrap gap-1">
          <UBadge 
            v-for="program in school.programs.slice(0, 4)" 
            :key="program.type"
            color="primary"
            variant="soft"
            size="xs"
          >
            {{ program.type }}
          </UBadge>
          <UBadge 
            v-if="school.programs.length > 4"
            color="neutral"
            variant="soft"
            size="xs"
          >
            +{{ school.programs.length - 4 }} more
          </UBadge>
        </div>
      </div>

      <!-- Cost Range -->
      <div v-if="costRange">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cost Range</p>
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(costRange.min) }}
          </span>
          <span class="text-xs text-gray-400">-</span>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(costRange.max) }}
          </span>
        </div>
      </div>

      <!-- Fleet Info -->
      <div v-if="school.fleet && school.fleet.totalAircraft">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fleet</p>
        <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            {{ school.fleet.totalAircraft }} Aircraft
          </span>
          <span v-if="school.fleet.simulators" class="flex items-center gap-1">
            <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
            {{ school.fleet.simulators.count }} Sim{{ school.fleet.simulators.count > 1 ? 's' : '' }}
          </span>
          <UBadge v-if="hasG1000" color="success" variant="soft" size="xs">
            G1000
          </UBadge>
        </div>
      </div>

      <!-- FSP Signals -->
      <div v-if="school.fsp_signals && school.fsp_signals.fleetUtilization" class="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500 dark:text-gray-400">Fleet Utilization</span>
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ school.fsp_signals.fleetUtilization }}%
          </span>
        </div>
        <UProgress 
          :value="school.fsp_signals.fleetUtilization" 
          :max="100"
          :color="school.fsp_signals.fleetUtilization > 75 ? 'success' : school.fsp_signals.fleetUtilization > 60 ? 'warning' : 'error'"
          size="xs"
          class="mt-1"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
          {{ school.instructors_count || 0 }} Instructors
        </div>
        <UButton 
          size="xs" 
          variant="ghost"
          trailing-icon="i-heroicons-arrow-right"
          @click.stop="navigateToSchool"
        >
          View Details
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { School } from '~~/types/database'

interface Props {
  school: School
}

const props = defineProps<Props>()
const router = useRouter()

// Computed properties
type NuxtUIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const tierColor = computed((): NuxtUIColor => {
  const tier = props.school.trust_tier
  const colorMap: Record<string, NuxtUIColor> = {
    'Premier': 'warning',
    'Verified': 'success',
    'Community': 'primary',
    'Unverified': 'neutral'
  }
  return colorMap[tier] || 'neutral'
})

const costRange = computed(() => {
  if (!props.school.programs || props.school.programs.length === 0) return null
  
  const costs = props.school.programs.flatMap(p => [p.minCost, p.maxCost])
  return {
    min: Math.min(...costs),
    max: Math.max(...costs)
  }
})

const hasG1000 = computed(() => {
  return props.school.fleet?.aircraft?.some(a => a.hasG1000) || false
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

const navigateToSchool = () => {
  router.push(`/schools/${props.school.id}`)
}
</script>

<style scoped>
@reference "../assets/css/main.css";

.school-card {
  @apply transition-transform duration-200;
}

.school-card:hover {
  transform: translateY(-0.25rem);
}
</style>

