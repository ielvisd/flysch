<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Search and Filters Section -->
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Filters Panel -->
        <div class="lg:col-span-1">
          <UCard variant="outline" class="bg-white" style="border: 2px solid rgba(0, 78, 137, 0.4); box-shadow: 0 4px 6px rgba(0, 78, 137, 0.1);">
            <template #header>
              <div class="flex items-center justify-between !py-2">
                <div class="flex items-center gap-2">
                  <UBadge color="primary" variant="solid" size="sm" icon="i-heroicons-funnel" class="min-h-[44px] px-3 rounded-lg touch-manipulation" style="background-color: #004E89; color: white;">
                    Filters
                  </UBadge>
                </div>
                <UButton 
                  size="sm" 
                  variant="solid" 
                  @click="clearFilters"
                  class="min-h-[44px] px-3 rounded-lg touch-manipulation"
                  style="background-color: #FF6B35; color: white;"
                >
                  Clear
                </UButton>
              </div>
            </template>

            <div class="space-y-4" style="margin-top: -1rem; padding-top: 0;">
              <!-- Text Search -->
              <div>
                <UInput 
                  v-model="filters.search"
                  placeholder="Search school name..."
                  icon="i-heroicons-magnifying-glass"
                  variant="outline"
                  @input="debouncedSearch"
                  class="min-h-[44px] w-full touch-manipulation"
                  style="border: 3px solid #1A659E; background-color: rgba(239, 239, 208, 0.3); border-radius: 0.5rem;"
                  :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30 rounded-lg w-full' }"
                  aria-label="Search flight schools by name"
                />
              </div>

              <!-- Location -->
              <div>
                <UInput 
                  v-model="locationInput"
                  placeholder="City or ZIP code"
                  icon="i-heroicons-map-pin"
                  variant="outline"
                  class="mb-2 min-h-[44px] w-full"
                  style="border: 3px solid #1A659E; background-color: rgba(239, 239, 208, 0.3); border-radius: 0.5rem;"
                  :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30 rounded-lg w-full' }"
                />
                <div class="flex items-center gap-2 mb-2">
                  <UButton 
                    size="md" 
                    variant="solid"
                    leading-icon="i-heroicons-map-pin"
                    @click="detectLocation"
                    :loading="detectingLocation"
                    class="min-h-[44px] w-full touch-manipulation"
                    style="background-color: #1A659E; color: white; border: 2px solid #004E89;"
                  >
                    Use My Location
                  </UButton>
                </div>
                <div v-if="filters.location">
                  <label class="block text-xs text-gray-500 mb-1">Radius: {{ filters.location.radius }} km</label>
                  <input 
                    v-model.number="filters.location.radius"
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    class="w-full"
                    @input="applyFilters"
                  />
                </div>
              </div>

              <!-- Programs -->
              <div>
                <label class="block text-sm font-medium mb-2 flex items-center gap-1" style="color: #004E89; font-weight: 600;">
                  🎓 Programs
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <UCheckbox 
                    v-for="program in programOptions"
                    :key="program"
                    :model-value="selectedPrograms.includes(program)"
                    :value="program"
                    :label="program"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center',
                      base: 'h-4 w-4 rounded border-2 border-gray-300 focus:ring-2 focus:ring-primary-500'
                    }"
                    @update:model-value="(val) => { if (val) selectedPrograms.push(program); else selectedPrograms = selectedPrograms.filter(p => p !== program); applyFilters(); }"
                  />
                </div>
              </div>

              <!-- Budget -->
              <div>
                <label class="block text-sm font-medium mb-2 flex items-center gap-1" style="color: #004E89; font-weight: 600;">
                  💰 Budget Range
                </label>
                <USelect 
                  v-model="budgetRange"
                  :options="budgetOptions"
                  @change="applyFilters"
                />
              </div>

              <!-- Training Type -->
              <div>
                <label class="block text-sm font-medium mb-2 flex items-center gap-1" style="color: #004E89; font-weight: 600;">
                  ✈️ Training Type
                </label>
                <div class="space-y-2">
                  <UCheckbox 
                    v-for="trainingType in ['Part 61', 'Part 141']"
                    :key="trainingType"
                    :model-value="selectedTrainingTypes.includes(trainingType)"
                    :value="trainingType"
                    :label="trainingType"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => { if (val) selectedTrainingTypes.push(trainingType); else selectedTrainingTypes = selectedTrainingTypes.filter(t => t !== trainingType); applyFilters(); }"
                  />
                </div>
              </div>

              <!-- Fleet Features -->
              <div>
                <label class="block text-sm font-medium mb-2 flex items-center gap-1" style="color: #004E89; font-weight: 600;">
                  🛩️ Fleet Features
                </label>
                <div class="space-y-2">
                  <UCheckbox 
                    v-model="filters.hasSimulator"
                    label="Simulator Available"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @change="applyFilters"
                  />
                  <UCheckbox 
                    v-model="filters.hasG1000"
                    label="G1000 Equipped"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @change="applyFilters"
                  />
                </div>
              </div>

              <!-- Trust Tier -->
              <div>
                <label class="block text-sm font-medium mb-2 flex items-center gap-1" style="color: #004E89; font-weight: 600;">
                  🛡️ Trust Tier
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <UCheckbox 
                    v-for="tier in trustTierOptions"
                    :key="tier"
                    :model-value="selectedTiers.includes(tier)"
                    :value="tier"
                    :label="tier"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => { if (val) selectedTiers.push(tier); else selectedTiers = selectedTiers.filter(t => t !== tier); applyFilters(); }"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Results Panel -->
        <div id="schools" class="lg:col-span-3 space-y-6">
          <!-- Map View -->
          <ClientOnly>
            <UCard variant="outline" class="bg-white" style="border: 2px solid rgba(0, 78, 137, 0.4); box-shadow: 0 4px 6px rgba(0, 78, 137, 0.1);">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold flex items-center gap-2" style="color: #004E89;">
                    <UIcon name="i-heroicons-map" class="w-5 h-5" />
                    School Locations
                  </h3>
                  <UBadge v-if="filters.location" color="primary" variant="soft" size="sm">
                    {{ filters.location.radius }}km radius
                  </UBadge>
                </div>
              </template>
              <div style="min-height: 400px;">
                <SchoolMap
                  v-if="schools && schools.length > 0"
                  :schools="schools"
                  :center="filters.location ? { lat: filters.location.lat, lng: filters.location.lng } : undefined"
                  :radius="filters.location?.radius || 100"
                  :show-radius="!!filters.location"
                  :zoom="filters.location ? 8 : 4"
                />
                <div v-else class="h-full flex items-center justify-center" style="min-height: 400px; background: linear-gradient(135deg, rgba(26, 101, 158, 0.1) 0%, rgba(0, 78, 137, 0.05) 100%);">
                  <div class="text-center" style="color: #004E89;">
                    <UIcon name="i-heroicons-map" class="w-12 h-12 mx-auto mb-2" />
                    <p class="text-sm font-medium">No schools to display</p>
                    <p class="text-xs mt-1" style="color: #6B7280;">Adjust your filters to see schools on the map</p>
                  </div>
                </div>
              </div>
            </UCard>
            <template #fallback>
              <UCard variant="outline" class="bg-white">
                <div class="h-96 flex items-center justify-center">
                  <USkeleton class="h-full w-full" />
                </div>
              </UCard>
            </template>
          </ClientOnly>

          <!-- Results Count and Sort -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h3 class="text-lg md:text-xl font-semibold flex items-center gap-2" style="color: #004E89;">
                <span v-if="!loading">🎯</span>
                {{ loading ? 'Loading...' : `${schools?.length || 0} Schools Found` }}
              </h3>
              <UBadge v-if="!loading && schools?.length" color="primary" variant="soft" size="sm">
                {{ schools.length }} results
              </UBadge>
            </div>
            <UButton 
              leading-icon="i-heroicons-arrows-up-down"
              variant="solid"
              size="sm"
              class="min-h-[44px] touch-manipulation"
              style="background-color: #FF6B35; color: white;"
            >
              <span class="hidden sm:inline">Sort</span>
              <span class="sm:hidden">Sort</span>
            </UButton>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-label="Loading schools">
            <USkeleton 
              v-for="i in 4" 
              :key="i" 
              class="h-64 rounded-lg" 
              aria-hidden="true"
            />
          </div>

          <!-- Results Grid -->
          <div v-else-if="schools && schools.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <SchoolCard 
              v-for="school in paginatedSchools" 
              :key="school.id"
              :school="school"
            />
          </div>

          <!-- No Results -->
          <div v-else class="text-center py-12" role="status" aria-live="polite">
            <div class="text-6xl mb-4" aria-hidden="true">🔍</div>
            <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 mx-auto mb-4" style="color: #9CA3AF;" aria-hidden="true" />
            <h3 class="text-lg font-semibold mb-2" style="color: #004E89;">
              No schools found
            </h3>
            <p class="mb-4" style="color: #6B7280;">
              Try adjusting your filters or expanding your search radius
            </p>
            <UButton 
              @click="clearFilters"
              variant="solid"
              leading-icon="i-heroicons-arrow-path"
              class="min-h-[44px] touch-manipulation"
              style="background-color: #FF6B35; color: white;"
              aria-label="Clear all filters"
            >
              Clear Filters
            </UButton>
          </div>

          <!-- Pagination -->
          <div v-if="schools && schools.length > pageSize" class="flex justify-center">
            <UPagination 
              v-model="currentPage"
              :total="schools.length"
              :page-size="pageSize"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchoolFilters } from '~~/types/database'
import { useSchools } from '~~/app/composables/useSchools'
import SchoolCard from '~~/app/components/SchoolCard.vue'
import SchoolMap from '~~/app/components/SchoolMap.vue'

// Meta tags
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Search Flight Schools',
  meta: [
    { name: 'description', content: 'Search and compare flight schools across the United States. Find the perfect school for your pilot training.' }
  ]
})

// Composables
const { fetchSchools, schools, loading } = useSchools()
const { coords, error: geoError } = useGeolocation()

// State
const filters = ref<SchoolFilters>({})
const locationInput = ref('')
const selectedPrograms = ref<string[]>([])
const selectedTiers = ref<string[]>([])
const selectedTrainingTypes = ref<string[]>([])
const budgetRange = ref('all')
const detectingLocation = ref(false)
const currentPage = ref(1)
const pageSize = 10

// Options
const programOptions = ['PPL', 'IR', 'CPL', 'CFI', 'CFII', 'MEI', 'ATP']
const trustTierOptions = ['Premier', 'Verified', 'Community', 'Unverified']
const budgetOptions = [
  { label: 'All Budgets', value: 'all' },
  { label: 'Under $10,000', value: 'under-10k' },
  { label: '$10,000 - $15,000', value: '10k-15k' },
  { label: '$15,000 - $25,000', value: '15k-25k' },
  { label: 'Over $25,000', value: 'over-25k' }
]

// Computed
const paginatedSchools = computed(() => {
  if (!schools.value || schools.value.length === 0) {
    return []
  }
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return schools.value.slice(start, end)
})


// Watch for program changes
watch(selectedPrograms, (newPrograms) => {
  filters.value.programs = newPrograms.length > 0 ? newPrograms as any : undefined
})

// Watch for tier changes
watch(selectedTiers, (newTiers) => {
  filters.value.trustTiers = newTiers.length > 0 ? newTiers as any : undefined
})

// Watch for training type changes
watch(selectedTrainingTypes, (newTypes) => {
  filters.value.trainingType = newTypes.length > 0 ? newTypes as any : undefined
})

// Watch for budget changes
watch(budgetRange, (newRange) => {
  switch (newRange) {
    case 'under-10k':
      filters.value.budgetMin = 0
      filters.value.budgetMax = 10000
      break
    case '10k-15k':
      filters.value.budgetMin = 10000
      filters.value.budgetMax = 15000
      break
    case '15k-25k':
      filters.value.budgetMin = 15000
      filters.value.budgetMax = 25000
      break
    case 'over-25k':
      filters.value.budgetMin = 25000
      filters.value.budgetMax = undefined
      break
    default:
      filters.value.budgetMin = undefined
      filters.value.budgetMax = undefined
  }
})

// Methods
const applyFilters = async () => {
  await fetchSchools(filters.value)
}

const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

const detectLocation = async () => {
  detectingLocation.value = true
  try {
    // Wait for geolocation to update
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (coords.value) {
      filters.value.location = {
        lat: coords.value.latitude,
        lng: coords.value.longitude,
        radius: 100 // Default 100km radius
      }
      locationInput.value = `${coords.value.latitude.toFixed(4)}, ${coords.value.longitude.toFixed(4)}`
      await applyFilters()
    }
  } catch (error) {
    console.error('Error detecting location:', error)
  } finally {
    detectingLocation.value = false
  }
}

const clearFilters = () => {
  filters.value = {}
  locationInput.value = ''
  selectedPrograms.value = []
  selectedTiers.value = []
  selectedTrainingTypes.value = []
  budgetRange.value = 'all'
  currentPage.value = 1
  applyFilters()
}

// Initial load
onMounted(async () => {
  await fetchSchools()
})
</script>

<style scoped>
.map-container {
  height: 400px;
  min-height: 300px;
}

@media (max-width: 768px) {
  .map-container {
    height: 250px;
    min-height: 250px;
  }
}

/* Mobile filter improvements */
@media (max-width: 1024px) {
  .lg\:col-span-1 {
    position: relative;
  }
}

/* Touch target improvements */
@media (max-width: 768px) {
  button, a, input, select, [role="button"], [role="link"] {
    min-height: 44px;
    min-width: 44px;
  }
  
  .touch-manipulation {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}

/* Hero section styling */
:deep(.page-hero) {
  background: transparent !important;
}

:deep(.page-hero .text-highlighted) {
  color: white !important;
}

:deep(.page-hero .text-muted) {
  color: rgba(255, 255, 255, 0.9) !important;
}
</style>


