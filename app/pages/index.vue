<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          Find Your Perfect Flight School
        </h1>
        <p class="text-xl text-blue-100 max-w-2xl">
          Compare trusted flight schools, explore programs, and start your aviation journey with confidence.
        </p>
      </div>
    </div>

    <!-- Search and Filters Section -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Filters Panel -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">Filters</h2>
                <UButton 
                  size="xs" 
                  variant="ghost" 
                  @click="clearFilters"
                >
                  Clear
                </UButton>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Text Search -->
              <div>
                <label class="block text-sm font-medium mb-2">Search</label>
                <UInput 
                  v-model="filters.search"
                  placeholder="School name..."
                  icon="i-heroicons-magnifying-glass"
                  @input="debouncedSearch"
                />
              </div>

              <!-- Location -->
              <div>
                <label class="block text-sm font-medium mb-2">Location</label>
                <UInput 
                  v-model="locationInput"
                  placeholder="City or ZIP code"
                  icon="i-heroicons-map-pin"
                  class="mb-2"
                />
                <div class="flex items-center gap-2 mb-2">
                  <UButton 
                    size="xs" 
                    variant="soft"
                    icon="i-heroicons-map-pin"
                    @click="detectLocation"
                    :loading="detectingLocation"
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
                <label class="block text-sm font-medium mb-2">Programs</label>
                <div class="space-y-2">
                  <UCheckbox 
                    v-for="program in programOptions"
                    :key="program"
                    :model-value="selectedPrograms.includes(program)"
                    :value="program"
                    :label="program"
                    @update:model-value="(val) => { if (val) selectedPrograms.push(program); else selectedPrograms = selectedPrograms.filter(p => p !== program); applyFilters(); }"
                  />
                </div>
              </div>

              <!-- Budget -->
              <div>
                <label class="block text-sm font-medium mb-2">Budget Range</label>
                <USelect 
                  v-model="budgetRange"
                  :options="budgetOptions"
                  @change="applyFilters"
                />
              </div>

              <!-- Training Type -->
              <div>
                <label class="block text-sm font-medium mb-2">Training Type</label>
                <div class="space-y-2">
                  <UCheckbox 
                    v-for="trainingType in ['Part 61', 'Part 141']"
                    :key="trainingType"
                    :model-value="selectedTrainingTypes.includes(trainingType)"
                    :value="trainingType"
                    :label="trainingType"
                    @update:model-value="(val) => { if (val) selectedTrainingTypes.push(trainingType); else selectedTrainingTypes = selectedTrainingTypes.filter(t => t !== trainingType); applyFilters(); }"
                  />
                </div>
              </div>

              <!-- Fleet Features -->
              <div>
                <label class="block text-sm font-medium mb-2">Fleet Features</label>
                <div class="space-y-2">
                  <UCheckbox 
                    v-model="filters.hasSimulator"
                    label="Simulator Available"
                    @change="applyFilters"
                  />
                  <UCheckbox 
                    v-model="filters.hasG1000"
                    label="G1000 Equipped"
                    @change="applyFilters"
                  />
                </div>
              </div>

              <!-- Trust Tier -->
              <div>
                <label class="block text-sm font-medium mb-2">Trust Tier</label>
                <div class="space-y-2">
                  <UCheckbox 
                    v-for="tier in trustTierOptions"
                    :key="tier"
                    :model-value="selectedTiers.includes(tier)"
                    :value="tier"
                    :label="tier"
                    @update:model-value="(val) => { if (val) selectedTiers.push(tier); else selectedTiers = selectedTiers.filter(t => t !== tier); applyFilters(); }"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Results Panel -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Map View -->
          <ClientOnly>
            <div class="map-container bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div class="h-full flex items-center justify-center text-gray-500">
                Map will render here (Leaflet integration)
              </div>
            </div>
          </ClientOnly>

          <!-- Results Count and Sort -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">
                {{ loading ? 'Loading...' : `${schools?.length || 0} Schools Found` }}
              </h3>
            </div>
            <UButton 
              icon="i-heroicons-arrows-up-down"
              variant="ghost"
              size="sm"
            >
              Sort
            </UButton>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <USkeleton 
              v-for="i in 4" 
              :key="i" 
              class="h-64 rounded-lg" 
            />
          </div>

          <!-- Results Grid -->
          <div v-else-if="schools && schools.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SchoolCard 
              v-for="school in paginatedSchools" 
              :key="school.id"
              :school="school"
            />
          </div>

          <!-- No Results -->
          <div v-else class="text-center py-12">
            <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No schools found
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your filters or expanding your search radius
            </p>
            <UButton 
              @click="clearFilters"
              variant="soft"
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
import { useSchools } from '~~/composables/useSchools'
import SchoolCard from '~~/components/SchoolCard.vue'

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
}

@media (max-width: 768px) {
  .map-container {
    height: 300px;
  }
}
</style>

