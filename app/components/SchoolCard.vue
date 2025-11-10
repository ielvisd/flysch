<template>
  <div ref="cardRef">
    <UCard 
      variant="outline"
      class="school-card cursor-pointer transition-all duration-200 bg-white"
      :style="{
        border: '2px solid rgba(0, 78, 137, 0.4)',
        boxShadow: '0 2px 4px rgba(0, 78, 137, 0.1)',
        ...(swipe.isSwiping.value ? swipe.getTransformStyle.value : {})
      }"
      @click="handleClick"
      @touchstart="swipe.handleTouchStart"
      @touchmove="swipe.handleTouchMove"
      @touchend="swipe.handleTouchEnd"
      @touchcancel="swipe.handleTouchCancel"
      :class="{ 'swiping': swipe.isSwiping.value }"
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
          variant="solid"
          size="sm"
          :icon="tierIcon"
          class="shrink-0"
          :style="tierBadgeStyle"
        >
          {{ displayTier }}
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

      <!-- Fleet Utilization -->
      <div v-if="school.fleet || school.fsp_signals?.fleetUtilization !== undefined" class="pt-2 border-t" style="border-color: #E5E7EB;">
        <div class="flex items-center justify-between text-xs mb-1">
          <span style="color: #6B7280;">Fleet Utilization</span>
        </div>
        <UProgress 
          :model-value="fleetUtilizationValue" 
          :max="100"
          :color="fleetUtilizationColor"
          size="xs"
          status
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
  </div>
</template>

<script setup lang="ts">
import type { School } from '~~/types/database'
import { useSwipe } from '~~/app/composables/useSwipe'

interface Props {
  school: School
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

const props = defineProps<Props>()
const router = useRouter()

// Swipe gesture handling
const swipe = useSwipe({
  onSwipeLeft: props.onSwipeLeft,
  onSwipeRight: props.onSwipeRight,
  threshold: 50,
  velocityThreshold: 0.3,
  preventVerticalScroll: true
})

// Track if we're in a swipe gesture to prevent click navigation
const isSwipeGesture = ref(false)

// Computed properties
type NuxtUIColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const displayTier = computed(() => {
  const tier = props.school.trust_tier
  // Handle null, undefined, empty string, or any falsy value
  if (!tier || (typeof tier === 'string' && tier.trim() === '')) {
    console.warn(`School ${props.school.name || props.school.id} has missing trust_tier, defaulting to Unverified`, { tier, school: props.school })
    return 'Unverified'
  }
  return tier
})

const tierColor = computed((): NuxtUIColor => {
  const tier = displayTier.value
  const colorMap: Record<string, NuxtUIColor> = {
    'Premier': 'warning',
    'Verified': 'success',
    'Community': 'primary',
    'Unverified': 'primary' // Use primary (blue) for better visibility in light mode
  }
  return colorMap[tier] || 'primary'
})

const tierBadgeStyle = computed(() => {
  const tier = displayTier.value
  // Ensure badges are always visible with explicit styles in light mode
  switch (tier) {
    case 'Premier':
      return {
        backgroundColor: '#f59e0b', // Amber/orange background
        color: 'white',
        border: 'none'
      }
    case 'Verified':
      return {
        backgroundColor: '#059669', // Dark green background
        color: 'white',
        border: 'none'
      }
    case 'Community':
      return {
        backgroundColor: '#1A659E', // Primary blue background
        color: 'white',
        border: 'none'
      }
    case 'Unverified':
      return {
        backgroundColor: '#3b82f6', // Blue background
        color: 'white',
        border: 'none'
      }
    default:
      return {
        backgroundColor: '#3b82f6', // Default to blue
        color: 'white',
        border: 'none'
      }
  }
})

const tierIcon = computed(() => {
  const tier = displayTier.value
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

const fleetUtilizationValue = computed(() => {
  return props.school.fsp_signals?.fleetUtilization ?? 0
})

const fleetUtilizationColor = computed((): NuxtUIColor => {
  const utilization = fleetUtilizationValue.value
  if (utilization >= 75) return 'success'
  if (utilization >= 60) return 'warning'
  if (utilization > 0) return 'error'
  return 'neutral'
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

// Watch for swipe state changes
watch(swipe.isSwiping, (swiping) => {
  if (swiping) {
    isSwipeGesture.value = true
  } else {
    // Reset after a short delay to allow swipe callbacks to execute
    setTimeout(() => {
      isSwipeGesture.value = false
    }, 100)
  }
})

const navigateToSchool = () => {
  router.push(`/schools/${props.school.id}`)
}

const handleClick = (e: MouseEvent) => {
  // Prevent navigation if this was part of a swipe gesture
  if (isSwipeGesture.value) {
    e.preventDefault()
    e.stopPropagation()
    return
  }
  navigateToSchool()
}

// Lazy loading intersection observer
const cardRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

useIntersectionObserver(
  cardRef,
  (entries) => {
    const entry = entries[0]
    if (entry) {
      isVisible.value = entry.isIntersecting
    }
  },
  {
    threshold: 0.1
  }
)
</script>

<style scoped>
.school-card {
  transition: transform 0.2s ease;
  touch-action: pan-y; /* Allow vertical scrolling, but handle horizontal swipes */
  user-select: none; /* Prevent text selection during swipe */
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.school-card:hover {
  transform: translateY(-0.25rem);
  border-color: #1A659E !important;
  border-width: 3px !important;
  box-shadow: 0 8px 16px rgba(26, 101, 158, 0.3) !important;
  background: linear-gradient(to bottom, #ffffff 0%, rgba(26, 101, 158, 0.02) 100%);
}

/* Disable hover effects during swipe */
.school-card.swiping:hover {
  transform: none;
}

/* Smooth swipe transitions */
.school-card.swiping {
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
  will-change: transform, opacity;
}

/* Mobile-specific: Full width cards for better swipe experience */
@media (max-width: 768px) {
  .school-card {
    width: 100%;
    touch-action: pan-y pinch-zoom;
  }
  
  /* Prevent accidental clicks during swipe */
  .school-card.swiping {
    pointer-events: auto;
  }
}
</style>

<style>
.dark .school-card:hover {
  background: linear-gradient(to bottom, #334155 0%, rgba(26, 101, 158, 0.15) 100%) !important;
  box-shadow: 0 8px 16px rgba(26, 101, 158, 0.4) !important;
}
</style>

