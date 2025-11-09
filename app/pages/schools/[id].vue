<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div v-if="loading" class="max-w-7xl mx-auto px-4 py-8">
      <USkeleton class="h-64 mb-6 rounded-lg" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <USkeleton class="h-96 rounded-lg" />
        <USkeleton class="h-96 rounded-lg" />
        <USkeleton class="h-96 rounded-lg" />
      </div>
    </div>

    <div v-else-if="school" class="max-w-7xl mx-auto px-4 py-8">
      <!-- Hero Section -->
      <UCard class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-2">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ school.name }}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
                  {{ school.address }}
                </p>
              </div>
              <UBadge 
                :color="tierBadge.color"
                :icon="tierBadge.icon"
                size="lg"
                variant="subtle"
              >
                {{ tierBadge.label }}
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-4 mb-4">
              <div v-if="school.phone" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                {{ school.phone }}
              </div>
              <div v-if="school.website" class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                <a :href="school.website" target="_blank" class="text-blue-600 hover:underline">
                  Visit Website
                </a>
              </div>
              <div v-if="school.email" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                {{ school.email }}
              </div>
            </div>

            <div class="flex gap-3">
              <UButton 
                color="primary"
                size="lg"
                icon="i-heroicons-paper-airplane"
                @click="openInquiryModal"
              >
                Request Information
              </UButton>
              <UButton 
                v-if="!school.claimed_by"
                variant="outline"
                size="lg"
                icon="i-heroicons-building-office"
                @click="claimSchool"
              >
                Claim School
              </UButton>
            </div>
          </div>

          <!-- Map Placeholder -->
          <div class="md:col-span-1">
            <ClientOnly>
              <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div class="text-center text-gray-500">
                  <UIcon name="i-heroicons-map" class="w-12 h-12 mx-auto mb-2" />
                  <p class="text-sm">Map View</p>
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="md:col-span-2 space-y-6">
          <!-- Programs Section -->
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <UIcon name="i-heroicons-academic-cap" class="w-6 h-6" />
                Training Programs
              </h2>
            </template>

            <UAccordion 
              v-if="school.programs && school.programs.length > 0"
              :items="programAccordionItems"
            />
            <p v-else class="text-gray-500">No programs listed</p>
          </UCard>

          <!-- Fleet Section -->
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <UIcon name="i-heroicons-paper-airplane" class="w-6 h-6" />
                Fleet
              </h2>
            </template>

            <div v-if="school.fleet && school.fleet.aircraft">
              <div class="space-y-4">
                <div 
                  v-for="aircraft in school.fleet.aircraft" 
                  :key="aircraft.type"
                  class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ aircraft.type }}
                    </p>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-sm text-gray-500">{{ aircraft.count }} available</span>
                      <UBadge 
                        v-if="aircraft.hasG1000" 
                        color="success" 
                        variant="soft" 
                        size="xs"
                      >
                        G1000
                      </UBadge>
                    </div>
                  </div>
                  <div v-if="aircraft.hourlyRate" class="text-right">
                    <p class="text-sm text-gray-500">Hourly Rate</p>
                    <p class="font-semibold text-gray-900 dark:text-white">
                      ${{ aircraft.hourlyRate }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="school.fleet.simulators" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 class="font-medium text-gray-900 dark:text-white mb-2">Simulators</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ school.fleet.simulators.count }} simulator{{ school.fleet.simulators.count > 1 ? 's' : '' }} available
                  ({{ school.fleet.simulators.types.join(', ') }})
                </p>
              </div>
            </div>
            <p v-else class="text-gray-500">No fleet information available</p>
          </UCard>

          <!-- Reviews Section (Mock) -->
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold flex items-center gap-2">
                <UIcon name="i-heroicons-star" class="w-6 h-6" />
                Student Reviews
              </h2>
            </template>

            <div class="space-y-4">
              <div 
                v-for="review in mockReviews" 
                :key="review.id"
                class="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div class="flex items-start gap-3">
                  <UAvatar 
                    :alt="review.name"
                    size="md"
                  />
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <p class="font-medium text-gray-900 dark:text-white">{{ review.name }}</p>
                      <span class="text-sm text-gray-500">{{ review.date }}</span>
                    </div>
                    <div class="flex items-center gap-1 mb-2">
                      <UIcon 
                        v-for="i in 5" 
                        :key="i"
                        name="i-heroicons-star-solid"
                        :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                        class="w-4 h-4"
                      />
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ review.text }}</p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="md:col-span-1 space-y-6">
          <!-- Evidence Panel -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
                Trust & Verification
              </h2>
            </template>

            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trust Tier</p>
                <UBadge 
                  :color="tierBadge.color"
                  :icon="tierBadge.icon"
                  size="md"
                  variant="subtle"
                  class="w-full justify-center py-2"
                >
                  {{ tierBadge.label }}
                </UBadge>
                <p class="text-xs text-gray-500 mt-2">{{ tierDescription }}</p>
              </div>

              <div v-if="tierCriteria.length > 0">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Criteria</p>
                <ul class="space-y-1">
                  <li 
                    v-for="(criterion, index) in tierCriteria"
                    :key="index"
                    class="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{{ criterion }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="school.verified_at">
                <p class="text-xs text-gray-500">
                  Verified: {{ formatDate(school.verified_at) }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Performance Metrics -->
          <UCard v-if="school.fsp_signals">
            <template #header>
              <h2 class="text-lg font-semibold flex items-center gap-2">
                <UIcon name="i-heroicons-chart-bar" class="w-5 h-5" />
                Performance Metrics
              </h2>
            </template>

            <div class="space-y-4">
              <div v-if="school.fsp_signals.avgHoursToPPL">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Avg. Hours to PPL</span>
                  <span class="font-medium">{{ school.fsp_signals.avgHoursToPPL }}h</span>
                </div>
              </div>

              <div v-if="school.fsp_signals.fleetUtilization">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Fleet Utilization</span>
                  <span class="font-medium">{{ school.fsp_signals.fleetUtilization }}%</span>
                </div>
                <UProgress 
                  :value="school.fsp_signals.fleetUtilization" 
                  :max="100"
                  :color="school.fsp_signals.fleetUtilization > 75 ? 'success' : 'warning'"
                  size="sm"
                />
              </div>

              <div v-if="school.fsp_signals.passRateFirstAttempt">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Pass Rate (1st Attempt)</span>
                  <span class="font-medium">{{ school.fsp_signals.passRateFirstAttempt }}%</span>
                </div>
                <UProgress 
                  :value="school.fsp_signals.passRateFirstAttempt" 
                  :max="100"
                  color="success"
                  size="sm"
                />
              </div>

              <div v-if="school.fsp_signals.studentSatisfaction">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Student Satisfaction</span>
                  <span class="font-medium">{{ school.fsp_signals.studentSatisfaction.toFixed(1) }}/5.0</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon 
                    v-for="i in 5" 
                    :key="i"
                    name="i-heroicons-star-solid"
                    :class="i <= school.fsp_signals.studentSatisfaction ? 'text-yellow-400' : 'text-gray-300'"
                    class="w-4 h-4"
                  />
                </div>
              </div>

              <div v-if="school.fsp_signals.avgTimeToComplete">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Avg. Time to Complete</span>
                  <span class="font-medium">{{ school.fsp_signals.avgTimeToComplete }} months</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Quick Stats -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">Quick Stats</h2>
            </template>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Instructors</span>
                <span class="font-medium">{{ school.instructors_count || 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Programs</span>
                <span class="font-medium">{{ school.programs?.length || 0 }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Aircraft</span>
                <span class="font-medium">{{ school.fleet?.totalAircraft || 0 }}</span>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 py-16 text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">School Not Found</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">The requested school could not be found.</p>
      <UButton to="/" icon="i-heroicons-arrow-left">Back to Search</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { School, Program, TrustTier } from '~~/types/database'
import { useSchools } from '~~/composables/useSchools'
import { useTiers } from '~~/composables/useTiers'

// Get route params
const route = useRoute()
const schoolId = route.params.id as string

// Composables
const { fetchSchool, subscribeToSchool } = useSchools()
const { getTierBadge, getTierDescription, getTierCriteria } = useTiers()
const toast = useToast()

// State
const school = ref<School | null>(null)
const loading = ref(true)

// Computed
const tierBadge = computed(() => {
  if (!school.value) return { label: 'Unverified' as TrustTier, color: 'neutral' as const, icon: 'i-heroicons-question-mark-circle' }
  return getTierBadge(school.value.trust_tier)
})

const tierDescription = computed(() => {
  if (!school.value) return ''
  return getTierDescription(school.value.trust_tier)
})

const tierCriteria = computed(() => {
  if (!school.value) return []
  return getTierCriteria(school.value.trust_tier)
})

const programAccordionItems = computed(() => {
  if (!school.value?.programs) return []
  
  return school.value.programs.map((program: Program) => ({
    label: `${program.type} - ${program.trainingType.join(' / ')}`,
    icon: 'i-heroicons-academic-cap',
    defaultOpen: false,
    slot: 'program',
    content: `
      <div class="space-y-3">
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Range</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            ${formatCurrency(program.minCost)} - ${formatCurrency(program.maxCost)}
          </p>
        </div>
        ${program.minHours ? `
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flight Hours Required</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              ${program.minHours.part61 ? `Part 61: ${program.minHours.part61}h` : ''}
              ${program.minHours.part141 ? ` | Part 141: ${program.minHours.part141}h` : ''}
            </p>
          </div>
        ` : ''}
        ${program.minMonths ? `
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeline</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              ${program.minMonths}-${program.maxMonths || program.minMonths + 2} months
            </p>
          </div>
        ` : ''}
        ${program.inclusions.length > 0 ? `
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Includes</p>
            <div class="flex flex-wrap gap-1">
              ${program.inclusions.map((inc: string) => `<span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">${inc}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `
  }))
})

// Mock reviews
const mockReviews = [
  {
    id: 1,
    name: 'John Smith',
    rating: 5,
    date: '2 months ago',
    text: 'Excellent flight school! The instructors are very knowledgeable and patient. Completed my PPL here in 4 months.'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    rating: 4,
    date: '3 months ago',
    text: 'Great facilities and well-maintained aircraft. Scheduling can be a bit tight during busy seasons.'
  },
  {
    id: 3,
    name: 'Mike Davis',
    rating: 5,
    date: '5 months ago',
    text: 'Highly recommend! Professional environment and excellent ground school program.'
  }
]

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const openInquiryModal = () => {
  toast.add({
    title: 'Contact Form',
    description: 'Inquiry modal would open here (to be implemented)',
    color: 'primary'
  })
}

const claimSchool = () => {
  console.log('Claim school clicked for:', school.value?.id)
  toast.add({
    title: 'Claim School',
    description: 'School claim flow would start here (mock for MVP)',
    color: 'primary'
  })
}

// Meta tags
useHead({
  title: computed(() => school.value ? school.value.name : 'School Profile'),
  meta: [
    {
      name: 'description',
      content: computed(() => 
        school.value 
          ? `Learn about ${school.value.name} - training programs, fleet, and student reviews.`
          : 'Flight school profile'
      )
    }
  ]
})

// Load school data and set up real-time subscription
onMounted(async () => {
  school.value = await fetchSchool(schoolId)
  loading.value = false

  if (school.value) {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSchool(schoolId, (updatedSchool: School) => {
      school.value = updatedSchool
      toast.add({
        title: 'School Updated',
        description: 'This school\'s information has been updated',
        color: 'primary'
      })
    })

    // Clean up subscription on unmount
    onUnmounted(() => {
      unsubscribe()
    })
  }
})
</script>

