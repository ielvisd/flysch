<template>
  <UCard 
    variant="outline"
    class="school-card cursor-pointer transition-all duration-200 bg-white"
    style="border: 2px solid rgba(0, 78, 137, 0.4); box-shadow: 0 2px 4px rgba(0, 78, 137, 0.1);"
    @click="navigateToSchool"
    v-intersect="onIntersect"
  >
    <template #header>
      <div class="flex justify-between items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-lg font-semibold truncate" style="color: #004E89;">
              ✈️ {{ school.name }}
            </h3>
          </div>
          <p class="text-sm flex items-center gap-1 mt-1" style="color: #374151;">
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
            {{ school.city }}, {{ school.state }}
          </p>
        </div>
        
        <UBadge 
          :color="tierColor"
          :variant="school.trust_tier === 'Premier' || school.trust_tier === 'Verified' ? 'solid' : 'subtle'"
          size="sm"
          :icon="tierIcon"
          class="shrink-0"
        >
          {{ school.trust_tier }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <!-- Programs -->
      <div v-if="school.programs && school.programs.length > 0">
        <p class="text-xs font-medium mb-1 flex items-center gap-1" style="color: #6B7280;">
          🎓 Programs Offered
        </p>
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
        <p class="text-xs font-medium mb-1 flex items-center gap-1" style="color: #6B7280;">
          💰 Cost Range
        </p>
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-semibold" style="color: #004E89;">
            {{ formatCurrency(costRange.min) }}
          </span>
          <span class="text-xs" style="color: #9CA3AF;">-</span>
          <span class="text-sm font-semibold" style="color: #004E89;">
            {{ formatCurrency(costRange.max) }}
          </span>
        </div>
      </div>

      <!-- Fleet Info -->
      <div v-if="school.fleet && school.fleet.totalAircraft">
        <p class="text-xs font-medium mb-1 flex items-center gap-1" style="color: #6B7280;">
          🛩️ Fleet
        </p>
        <div class="flex items-center gap-3 text-sm" style="color: #374151;">
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
      <div v-if="school.fsp_signals && school.fsp_signals.fleetUtilization" class="pt-2 border-t" style="border-color: #E5E7EB;">
        <div class="flex items-center justify-between text-xs">
          <span style="color: #6B7280;">Fleet Utilization</span>
          <span class="font-medium" style="color: #004E89;">
            {{ school.fsp_signals.fleetUtilization }}%
          </span>
        </div>
        <UProgress 
          :model-value="school.fsp_signals.fleetUtilization" 
          :max="100"
          color="primary"
          size="xs"
          class="mt-1"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs" style="color: #6B7280;">
          <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
          👨‍✈️ {{ school.instructors_count || 0 }} Instructors
        </div>
        <UButton 
          size="sm" 
          trailing-icon="i-heroicons-arrow-right"
          @click.stop="navigateToSchool"
          variant="solid"
          class="hover:opacity-90 transition-opacity font-semibold"
          style="background-color: #FF6B35; color: white;"
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

const tierIcon = computed(() => {
  const tier = props.school.trust_tier
  const iconMap: Record<string, string> = {
    'Premier': 'i-heroicons-star',
    'Verified': 'i-heroicons-shield-check',
    'Community': 'i-heroicons-user-group',
    'Unverified': 'i-heroicons-question-mark-circle'
  }
  return iconMap[tier] || 'i-heroicons-question-mark-circle'
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

// Lazy loading intersection observer
const isVisible = ref(false)
const onIntersect = (isIntersecting: boolean) => {
  isVisible.value = isIntersecting
}
</script>

<style scoped>
.school-card {
  transition: transform 0.2s ease;
}

.school-card:hover {
  transform: translateY(-0.25rem);
  border-color: #1A659E !important;
  border-width: 3px !important;
  box-shadow: 0 8px 16px rgba(26, 101, 158, 0.3) !important;
  background: linear-gradient(to bottom, #ffffff 0%, rgba(26, 101, 158, 0.02) 100%);
}
</style>

