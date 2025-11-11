<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Search and Filters Section -->
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Filters Panel -->
        <div class="lg:col-span-1">
          <!-- Desktop: Always visible filters -->
          <UCard variant="outline" class="bg-white hidden lg:block" style="border: 2px solid rgba(0, 78, 137, 0.4); box-shadow: 0 4px 6px rgba(0, 78, 137, 0.1);">
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
                  :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30 rounded-lg w-full placeholder:text-gray-600' }"
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
                  :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30 rounded-lg w-full placeholder:text-gray-600' }"
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
                    :model-value="programCheckedMap.get(program) ?? false"
                    :value="program"
                    :label="program"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => toggleProgram(program, val)"
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
                  :items="budgetOptions"
                  value-key="value"
                  placeholder="Select budget range"
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
                    :model-value="trainingTypeCheckedMap.get(trainingType) ?? false"
                    :value="trainingType"
                    :label="trainingType"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => toggleTrainingType(trainingType, val)"
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
                    @update:model-value="applyFilters"
                  />
                  <UCheckbox 
                    v-model="filters.hasG1000"
                    label="G1000 Equipped"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="applyFilters"
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
                    :model-value="tierCheckedMap.get(tier) ?? false"
                    :value="tier"
                    :label="tier"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => toggleTier(tier, val)"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Mobile: Filters -->
          <UCard variant="outline" class="bg-white lg:hidden" style="border: 2px solid rgba(0, 78, 137, 0.4); box-shadow: 0 4px 6px rgba(0, 78, 137, 0.1);">
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
                  :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30 rounded-lg w-full placeholder:text-gray-600' }"
                  aria-label="Search flight schools by name"
                />
              </div>

              <!-- Location -->
              <div>
                <label class="block text-sm font-medium mb-2 flex items-center gap-1" style="color: #004E89; font-weight: 600;">
                  📍 Location
                </label>
                <UInput 
                  v-model="locationInput"
                  placeholder="City or ZIP code"
                  icon="i-heroicons-map-pin"
                  variant="outline"
                  class="mb-2 min-h-[44px] w-full"
                  style="border: 3px solid #1A659E; background-color: rgba(239, 239, 208, 0.3); border-radius: 0.5rem;"
                  :ui="{ base: 'focus:border-[#004E89] focus:ring-2 focus:ring-[#1A659E] focus:ring-opacity-30 rounded-lg w-full placeholder:text-gray-600' }"
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
                    :model-value="programCheckedMap.get(program) ?? false"
                    :value="program"
                    :label="program"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => toggleProgram(program, val)"
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
                  :items="budgetOptions"
                  value-key="value"
                  placeholder="Select budget range"
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
                    :model-value="trainingTypeCheckedMap.get(trainingType) ?? false"
                    :value="trainingType"
                    :label="trainingType"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => toggleTrainingType(trainingType, val)"
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
                    @update:model-value="applyFilters"
                  />
                  <UCheckbox 
                    v-model="filters.hasG1000"
                    label="G1000 Equipped"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="applyFilters"
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
                    :model-value="tierCheckedMap.get(tier) ?? false"
                    :value="tier"
                    :label="tier"
                    :ui="{ 
                      label: 'text-gray-900 font-medium text-sm',
                      wrapper: 'flex items-center'
                    }"
                    @update:model-value="(val) => toggleTier(tier, val)"
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
                  v-if="!loading && schools && schools.length > 0"
                  :key="`map-${schools.length}-${JSON.stringify(filters.location || {})}`"
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

          <!-- Results Count, Sort, and View Toggle -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <h3 class="text-lg md:text-xl font-semibold flex items-center gap-2" style="color: #004E89;">
                <span v-if="!loading">🎯</span>
                {{ loading ? 'Loading...' : `${schools?.length || 0} Schools Found` }}
              </h3>
            </div>
            <div class="flex items-center gap-2">
              <!-- View Toggle -->
              <div class="flex items-center gap-1 border rounded-lg" style="border-color: rgba(0, 78, 137, 0.3);">
                <UButton 
                  :variant="viewMode === 'cards' ? 'solid' : 'ghost'"
                  size="sm"
                  icon="i-heroicons-squares-2x2"
                  @click="viewMode = 'cards'"
                  class="min-h-[44px] touch-manipulation rounded-r-none"
                  :style="viewMode === 'cards' ? 'background-color: #FF6B35; color: white;' : ''"
                  aria-label="Card view"
                />
                <UButton 
                  :variant="viewMode === 'table' ? 'solid' : 'ghost'"
                  size="sm"
                  icon="i-heroicons-table-cells"
                  @click="viewMode = 'table'"
                  class="min-h-[44px] touch-manipulation rounded-l-none"
                  :style="viewMode === 'table' ? 'background-color: #FF6B35; color: white;' : ''"
                  aria-label="Table view"
                />
              </div>
              <!-- Sort Dropdown -->
              <UDropdownMenu 
                :items="sortMenuItems"
                :content="{ align: 'end' }"
              >
                <UButton 
                  leading-icon="i-heroicons-arrows-up-down"
                  trailing-icon="i-heroicons-chevron-down"
                  variant="solid"
                  size="sm"
                  class="min-h-[44px] touch-manipulation"
                  style="background-color: #FF6B35; color: white;"
                >
                  <span class="hidden sm:inline">{{ currentSortLabel || 'Sort' }}</span>
                  <span class="sm:hidden">{{ currentSortLabelMobile || 'Sort' }}</span>
                </UButton>
              </UDropdownMenu>
            </div>
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

          <!-- Results Grid (Card View) -->
          <div v-else-if="schools && schools.length > 0 && viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" ref="cardsContainer">
            <SchoolCard 
              v-for="(school, index) in paginatedSchools" 
              :key="school.id"
              :school="school"
              :ref="el => setCardRef(el, index)"
              :on-swipe-left="() => navigateToNextCard(index)"
              :on-swipe-right="() => navigateToPreviousCard(index)"
            />
          </div>

          <!-- Results Table (Table View) -->
          <div v-else-if="schools && schools.length > 0 && viewMode === 'table'" class="overflow-x-auto table-wrapper">
            <UTable 
              :key="`table-${tableSort.map(s => `${s.id}-${s.direction}`).join('-')}`"
              :data="sortedSchools"
              :columns="tableColumns"
              v-model:sort="tableSort"
              :page-size="pageSize"
              v-model:page="currentPage"
              class="w-full table-sortable"
            >
              <template #name-data="{ row }">
                <div class="flex items-center gap-2">
                  <NuxtLink 
                    :to="`/schools/${row.original.id}`"
                    class="font-semibold hover:underline"
                    style="color: #004E89;"
                  >
                    {{ row.original.name }}
                  </NuxtLink>
                </div>
              </template>

              <template #location-data="{ row }">
                <div class="flex items-center gap-1 text-sm" style="color: #6B7280;">
                  <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                  <span>{{ row.original.city }}, {{ row.original.state }}</span>
                </div>
              </template>

              <template #programs-data="{ row }">
                <div class="flex flex-wrap gap-1">
                  <UBadge 
                    v-for="program in (row.original.programs?.slice(0, 3) || [])"
                    :key="program.type"
                    color="primary"
                    variant="soft"
                    size="xs"
                  >
                    {{ program.type }}
                  </UBadge>
                  <span v-if="(row.original.programs?.length || 0) > 3" class="text-xs" style="color: #6B7280;">
                    +{{ (row.original.programs?.length || 0) - 3 }} more
                  </span>
                </div>
              </template>

              <template #cost-data="{ row }">
                <div v-if="row.original.programs && row.original.programs.length > 0" class="text-sm">
                  <span class="font-medium" style="color: #004E89;">
                    ${{ Math.min(...row.original.programs.map((p: any) => p.minCost)).toLocaleString() }}k - 
                    ${{ Math.max(...row.original.programs.map((p: any) => p.maxCost)).toLocaleString() }}k
                  </span>
                </div>
                <span v-else class="text-sm" style="color: #9CA3AF;">N/A</span>
              </template>

              <template #tier-data="{ row }">
                <UBadge 
                  :color="getTierColor(row.original.trust_tier || 'Unverified')"
                  variant="solid"
                  size="sm"
                  :icon="getTierIcon(row.original.trust_tier || 'Unverified')"
                  :style="getTierBadgeStyle(row.original.trust_tier || 'Unverified')"
                >
                  {{ row.original.trust_tier || 'Unverified' }}
                </UBadge>
              </template>

              <template #actions-data="{ row }">
                <UButton 
                  size="sm"
                  variant="solid"
                  @click="$router.push(`/schools/${row.original.id}`)"
                  style="background-color: #FF6B35; color: white;"
                  class="min-h-[36px] touch-manipulation"
                >
                  View Details
                </UButton>
              </template>
            </UTable>
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

          <!-- Pagination (only for card view, table has built-in pagination) -->
          <div v-if="viewMode === 'cards' && sortedSchools && sortedSchools.length > pageSize" class="flex justify-center">
            <UPagination 
              v-model="currentPage"
              :total="sortedSchools.length"
              :page-size="pageSize"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { Column } from '@tanstack/vue-table'
import type { SchoolFilters, TrustTier } from '~~/types/database'
import { useSchools } from '~~/app/composables/useSchools'
import { useTiers } from '~~/app/composables/useTiers'
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
const { fetchSchools, schools, loading, calculateDistance, parseLocation } = useSchools()
const { getTierColor, getTierIcon } = useTiers()
const { coords, error: geoError } = useGeolocation()

// Helper function to get badge styles for table view
const getTierBadgeStyle = (tier: string) => {
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
}

// State
const filters = ref<SchoolFilters>({})
const locationInput = ref('')
const selectedPrograms = ref<string[]>([])
const selectedTiers = ref<string[]>([])
const selectedTrainingTypes = ref<string[]>([])
const budgetRange = ref('all')

// Note: Using arrays directly in template - Vue auto-unwraps refs in templates

const detectingLocation = ref(false)
const currentPage = ref(1)
const pageSize = 10
const sortBy = ref<string>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const viewMode = ref<'cards' | 'table'>('cards')
const cardsContainer = ref<HTMLElement | null>(null)
const cardRefs = ref<Array<{ $el?: HTMLElement } | null>>([])

// Computed - Current sort label for button display (defined early for template access)
const currentSortLabel = computed(() => {
  const sortLabels: Record<string, { asc: string; desc: string }> = {
    name: { asc: 'Name (A-Z)', desc: 'Name (Z-A)' },
    cost: { asc: 'Cost (Low-High)', desc: 'Cost (High-Low)' },
    distance: { asc: 'Distance (Nearest)', desc: 'Distance (Farthest)' },
    tier: { asc: 'Trust Tier', desc: 'Trust Tier' }
  }
  
  const label = sortLabels[sortBy.value]?.[sortOrder.value] || 'Sort'
  return label
})

const currentSortLabelMobile = computed(() => {
  // Shorter labels for mobile
  const sortLabels: Record<string, { asc: string; desc: string }> = {
    name: { asc: 'Name ↑', desc: 'Name ↓' },
    cost: { asc: 'Cost ↑', desc: 'Cost ↓' },
    distance: { asc: 'Near ↑', desc: 'Far ↓' },
    tier: { asc: 'Tier', desc: 'Tier' }
  }
  
  const label = sortLabels[sortBy.value]?.[sortOrder.value] || 'Sort'
  return label
})

// Options
const programOptions = ['PPL', 'IR', 'CPL', 'CFI', 'CFII', 'MEI', 'ATP']
const trustTierOptions = ['Premier', 'Verified', 'Community', 'Unverified']

// Use Maps to track checked state for better reactivity
const tierCheckedMap = computed(() => {
  const map = new Map<string, boolean>()
  trustTierOptions.forEach(tier => {
    map.set(tier, selectedTiers.value.includes(tier))
  })
  return map
})

const trainingTypeCheckedMap = computed(() => {
  const map = new Map<string, boolean>()
  ;['Part 61', 'Part 141'].forEach(type => {
    map.set(type, selectedTrainingTypes.value.includes(type))
  })
  return map
})

const programCheckedMap = computed(() => {
  const map = new Map<string, boolean>()
  programOptions.forEach(program => {
    map.set(program, selectedPrograms.value.includes(program))
  })
  return map
})
const budgetOptions = [
  { label: 'All Budgets', value: 'all' },
  { label: 'Under $10,000', value: 'under-10k' },
  { label: '$10,000 - $15,000', value: '10k-15k' },
  { label: '$15,000 - $25,000', value: '15k-25k' },
  { label: 'Over $25,000', value: 'over-25k' }
]

// Sort menu items
const sortMenuItems = computed(() => {
  const items: any[] = [
    [{
      label: 'Name (A-Z)',
      icon: sortBy.value === 'name' && sortOrder.value === 'asc' ? 'i-heroicons-check' : undefined,
      onSelect: () => {
        sortBy.value = 'name'
        sortOrder.value = 'asc'
      }
    }, {
      label: 'Name (Z-A)',
      icon: sortBy.value === 'name' && sortOrder.value === 'desc' ? 'i-heroicons-check' : undefined,
      onSelect: () => {
        sortBy.value = 'name'
        sortOrder.value = 'desc'
      }
    }],
    [{
      label: 'Cost (Low to High)',
      icon: sortBy.value === 'cost' && sortOrder.value === 'asc' ? 'i-heroicons-check' : undefined,
      onSelect: () => {
        sortBy.value = 'cost'
        sortOrder.value = 'asc'
      }
    }, {
      label: 'Cost (High to Low)',
      icon: sortBy.value === 'cost' && sortOrder.value === 'desc' ? 'i-heroicons-check' : undefined,
      onSelect: () => {
        sortBy.value = 'cost'
        sortOrder.value = 'desc'
      }
    }]
  ]

  // Add distance sort only if location filter is active
  if (filters.value.location) {
    items.push([{
      label: 'Distance (Nearest)',
      icon: sortBy.value === 'distance' && sortOrder.value === 'asc' ? 'i-heroicons-check' : undefined,
      onSelect: () => {
        sortBy.value = 'distance'
        sortOrder.value = 'asc'
      }
    }, {
      label: 'Distance (Farthest)',
      icon: sortBy.value === 'distance' && sortOrder.value === 'desc' ? 'i-heroicons-check' : undefined,
      onSelect: () => {
        sortBy.value = 'distance'
        sortOrder.value = 'desc'
      }
    }])
  }

  items.push([{
    label: 'Trust Tier',
    icon: sortBy.value === 'tier' ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      sortBy.value = 'tier'
      sortOrder.value = 'asc'
    }
  }])

  return items
})

// Table sort state (for built-in table sorting)
const tableSort = ref<Array<{ id: string; direction: 'asc' | 'desc' }>>([{ id: 'name', direction: 'asc' }])

// Helper function to create sortable header with visual indicators
const createSortableHeader = (column: Column<any, unknown>, label: string) => {
  const UButton = resolveComponent('UButton')
  const isSorted = column.getIsSorted()
  
  const getSortIcon = () => {
    if (isSorted === 'asc') return 'i-heroicons-arrow-up'
    if (isSorted === 'desc') return 'i-heroicons-arrow-down'
    return 'i-heroicons-arrows-up-down'
  }
  
  const getSortColor = () => {
    if (isSorted) return 'primary'
    return 'neutral'
  }
  
  return h(UButton, {
    color: getSortColor(),
    variant: 'ghost',
    label,
    icon: getSortIcon(),
    class: '-mx-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
    style: isSorted ? { color: '#004E89' } : {},
    onClick: () => {
      const currentSort = column.getIsSorted()
      if (currentSort === 'asc') {
        column.toggleSorting(true) // Switch to desc
      } else if (currentSort === 'desc') {
        column.clearSorting() // Clear sort
      } else {
        column.toggleSorting(false) // Switch to asc
      }
    },
    'aria-label': `Sort by ${label} ${isSorted === 'asc' ? 'descending' : isSorted === 'desc' ? 'clearing sort' : 'ascending'}`
  })
}

// Table columns configuration
const tableColumns = computed(() => {
  const columns: any[] = [
    {
      id: 'name',
      key: 'name',
      header: ({ column }: { column: Column<any, unknown> }) => createSortableHeader(column, 'School Name'),
      sortable: true,
      accessorFn: (row: any) => row.name
    },
    {
      id: 'location',
      key: 'location',
      header: ({ column }: { column: Column<any, unknown> }) => createSortableHeader(column, 'Location'),
      sortable: true,
      accessorFn: (row: any) => {
        // If location filter is active, sort by distance
        if (filters.value.location) {
          const point = parseLocation(row.location)
          if (!point) return Infinity
          return calculateDistance(
            filters.value.location!.lat,
            filters.value.location!.lng,
            point.lat,
            point.lng
          )
        }
        // Otherwise, sort alphabetically by city, then state
        return `${row.city || ''}, ${row.state || ''}`
      }
    },
    {
      id: 'programs',
      key: 'programs',
      header: ({ column }: { column: Column<any, unknown> }) => createSortableHeader(column, 'Programs'),
      sortable: true,
      accessorFn: (row: any) => row.programs?.length || 0
    },
    {
      id: 'cost',
      key: 'cost',
      header: ({ column }: { column: Column<any, unknown> }) => createSortableHeader(column, 'Cost Range'),
      sortable: true,
      accessorFn: (row: any) => {
        if (!row.programs || row.programs.length === 0) return Infinity
        return Math.min(...row.programs.map((p: any) => p.minCost))
      }
    },
    {
      id: 'tier',
      key: 'tier',
      header: ({ column }: { column: Column<any, unknown> }) => createSortableHeader(column, 'Trust Tier'),
      sortable: true,
      accessorFn: (row: any) => {
        const tierOrder: Record<string, number> = {
          'Premier': 4,
          'Verified': 3,
          'Community': 2,
          'Unverified': 1
        }
        return tierOrder[row.trust_tier] || 0
      }
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'Actions'
    }
  ]
  
  return columns
})

// Computed - Sort schools (for card view and dropdown sort)
const sortedSchools = computed(() => {
  if (!schools.value || schools.value.length === 0) {
    return []
  }

  // If using table view, let the table handle sorting
  if (viewMode.value === 'table') {
    return schools.value
  }

  // For card view, apply custom sorting
  const sorted = [...schools.value]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break

      case 'cost': {
        const aPrograms = a.programs || []
        const bPrograms = b.programs || []
        
        if (aPrograms.length === 0 && bPrograms.length === 0) {
          comparison = 0
          break
        }
        if (aPrograms.length === 0) return 1 // Schools without programs go to end
        if (bPrograms.length === 0) return -1
        
        const aMinCost = Math.min(...aPrograms.map((p: any) => p.minCost || Infinity))
        const bMinCost = Math.min(...bPrograms.map((p: any) => p.minCost || Infinity))
        comparison = aMinCost - bMinCost
        break
      }

      case 'distance': {
        if (!filters.value.location) {
          comparison = 0
          break
        }
        const aPoint = parseLocation(a.location)
        const bPoint = parseLocation(b.location)
        
        // Schools without location go to end
        if (!aPoint && !bPoint) {
          comparison = 0
          break
        }
        if (!aPoint) return 1
        if (!bPoint) return -1
        
        const aDistance = calculateDistance(
          filters.value.location.lat,
          filters.value.location.lng,
          aPoint.lat,
          aPoint.lng
        )
        const bDistance = calculateDistance(
          filters.value.location.lat,
          filters.value.location.lng,
          bPoint.lat,
          bPoint.lng
        )
        comparison = aDistance - bDistance
        break
      }

      case 'tier': {
        const tierOrder: Record<string, number> = {
          'Premier': 4,
          'Verified': 3,
          'Community': 2,
          'Unverified': 1
        }
        const aTier = tierOrder[a.trust_tier] || 0
        const bTier = tierOrder[b.trust_tier] || 0
        comparison = aTier - bTier // Lower tier number = higher tier, so ascending means Premier first
        break
      }

      default:
        comparison = 0
    }

    // Apply sort order (ascending or descending)
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return sorted
})

// Computed - Paginate sorted schools (for card view)
const paginatedSchools = computed(() => {
  if (viewMode.value === 'table') {
    // Table handles its own pagination
    return []
  }
  
  if (!sortedSchools.value || sortedSchools.value.length === 0) {
    return []
  }
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return sortedSchools.value.slice(start, end)
})


// Note: Program changes are handled directly in the checkbox @update:model-value handler
// to ensure immediate filter application

// Note: Tier and training type changes are handled directly in their checkbox handlers
// to ensure immediate filter application

// Watch for budget changes
watch(budgetRange, async (newRange) => {
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
  await nextTick()
  await applyFilters()
})

// Sync table sort with dropdown sort when in table view
watch([sortBy, sortOrder], ([newSortBy, newSortOrder]) => {
  if (viewMode.value === 'table') {
    const direction = newSortOrder === 'asc' ? 'asc' : 'desc'
    // Map our sort keys to table column keys
    const columnMap: Record<string, string> = {
      'name': 'name',
      'cost': 'cost',
      'tier': 'tier',
      'distance': 'location' // Distance uses location column
    }
    const columnKey = columnMap[newSortBy] || 'name'
    tableSort.value = [{ id: columnKey, direction }]
  }
})

// Sync dropdown sort with table sort when table sort changes
watch(tableSort, (newSort) => {
  if (viewMode.value === 'table' && newSort.length > 0) {
    const sort = newSort[0]
    if (!sort) return
    // Map table column keys back to our sort keys
    const keyMap: Record<string, string> = {
      'name': 'name',
      'cost': 'cost',
      'tier': 'tier',
      'location': 'distance'
    }
    const mappedKey = keyMap[sort.id] || 'name'
    sortBy.value = mappedKey
    sortOrder.value = sort.direction
  }
})

// Helper functions for checkbox handlers
const toggleProgram = async (program: string, checked: boolean | "indeterminate") => {
  const isChecked = checked === true
  // Update array synchronously first
  if (isChecked) {
    if (!selectedPrograms.value.includes(program)) {
      selectedPrograms.value = [...selectedPrograms.value, program]
    }
  } else {
    selectedPrograms.value = selectedPrograms.value.filter((p: string) => p !== program)
  }
  // Update filters synchronously
  filters.value.programs = selectedPrograms.value.length > 0 ? selectedPrograms.value as any : undefined
  // Wait for reactivity to propagate
  await nextTick()
  // Then apply filters
  await applyFilters()
}

const toggleTrainingType = async (trainingType: string, checked: boolean | "indeterminate") => {
  const isChecked = checked === true
  // Update array synchronously first
  if (isChecked) {
    if (!selectedTrainingTypes.value.includes(trainingType)) {
      selectedTrainingTypes.value = [...selectedTrainingTypes.value, trainingType]
    }
  } else {
    selectedTrainingTypes.value = selectedTrainingTypes.value.filter((t: string) => t !== trainingType)
  }
  // Update filters synchronously
  filters.value.trainingType = selectedTrainingTypes.value.length > 0 ? selectedTrainingTypes.value as any : undefined
  // Wait for reactivity to propagate
  await nextTick()
  // Then apply filters
  await applyFilters()
}

const toggleTier = async (tier: string, checked: boolean | "indeterminate") => {
  const isChecked = checked === true
  // Update array synchronously first
  if (isChecked) {
    if (!selectedTiers.value.includes(tier)) {
      selectedTiers.value = [...selectedTiers.value, tier]
    }
  } else {
    selectedTiers.value = selectedTiers.value.filter((t: string) => t !== tier)
  }
  // Update filters synchronously
  filters.value.trustTiers = selectedTiers.value.length > 0 ? selectedTiers.value as any : undefined
  // Wait for reactivity to propagate
  await nextTick()
  // Then apply filters
  await applyFilters()
}

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
  sortBy.value = 'name'
  sortOrder.value = 'asc'
  tableSort.value = [{ id: 'name', direction: 'asc' }]
  applyFilters()
}

// Card navigation for swipe gestures
const setCardRef = (el: any, index: number) => {
  if (el) {
    cardRefs.value[index] = el
  }
}

const navigateToNextCard = (currentIndex: number) => {
  const nextIndex = currentIndex + 1
  if (nextIndex < paginatedSchools.value.length) {
    scrollToCard(nextIndex)
  } else {
    // If on last card of page, go to next page
    if (currentPage.value * pageSize < sortedSchools.value.length) {
      currentPage.value++
      nextTick(() => {
        scrollToCard(0)
      })
    }
  }
}

const navigateToPreviousCard = (currentIndex: number) => {
  const prevIndex = currentIndex - 1
  if (prevIndex >= 0) {
    scrollToCard(prevIndex)
  } else {
    // If on first card of page, go to previous page
    if (currentPage.value > 1) {
      currentPage.value--
      nextTick(() => {
        const lastIndex = paginatedSchools.value.length - 1
        scrollToCard(lastIndex)
      })
    }
  }
}

const scrollToCard = (index: number) => {
  nextTick(() => {
    const card = cardRefs.value[index]
    if (card && card.$el) {
      card.$el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  })
}

// Initial load
onMounted(async () => {
  const fetched = await fetchSchools()
  console.debug('Initial fetch completed:', {
    count: fetched?.length || 0,
    schoolsWithLocation: fetched?.filter((s: any) => s.location).length || 0,
    sampleSchool: fetched?.[0] ? {
      id: fetched[0].id,
      name: fetched[0].name,
      location: fetched[0].location,
      locationType: typeof fetched[0].location
    } : null
  })
  console.debug('Schools reactive value:', {
    count: schools.value?.length || 0,
    schools: schools.value
  })
})
</script>

<style scoped>
.map-container {
  height: 400px;
  min-height: 300px;
}

/* Table row animations for smooth sorting transitions */
.table-wrapper :deep(.u-table tbody tr) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.table-wrapper :deep(.u-table tbody tr:hover) {
  background-color: rgba(0, 78, 137, 0.05);
  transition: background-color 0.2s ease;
}

/* Smooth fade-in for table rows when sort changes */
.table-sortable :deep(.u-table tbody tr) {
  animation: fadeInRow 0.3s ease-in-out;
}

@keyframes fadeInRow {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced header button hover effects */
.table-sortable :deep(.u-table th button) {
  transition: all 0.2s ease;
}

.table-sortable :deep(.u-table th button:hover) {
  transform: scale(1.05);
}

/* Sort indicator animation */
.table-sortable :deep(.u-table th button[class*="icon"]) {
  transition: transform 0.2s ease;
}

.table-sortable :deep(.u-table th button:hover [class*="icon"]) {
  transform: scale(1.1);
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

  /* Table responsive styling */
  :deep(.u-table) {
    font-size: 0.875rem;
  }

  :deep(.u-table th),
  :deep(.u-table td) {
    padding: 0.5rem;
  }

  /* Stack table columns on very small screens */
  @media (max-width: 640px) {
    :deep(.u-table) {
      display: block;
    }

    :deep(.u-table thead) {
      display: none;
    }

    :deep(.u-table tbody) {
      display: block;
    }

    :deep(.u-table tr) {
      display: block;
      margin-bottom: 1rem;
      border: 2px solid rgba(0, 78, 137, 0.2);
      border-radius: 0.5rem;
      padding: 0.75rem;
      background: white;
    }

    :deep(.u-table td) {
      display: block;
      text-align: left;
      padding: 0.5rem 0;
      border: none;
      border-bottom: 1px solid rgba(0, 78, 137, 0.1);
    }

    :deep(.u-table td:before) {
      content: attr(data-label);
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
      color: #004E89;
    }

    :deep(.u-table td:last-child) {
      border-bottom: none;
    }
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

/* Ensure placeholder text is dark and readable in light mode */
:deep(input::placeholder),
:deep(input[type="text"]::placeholder),
:deep(input[type="search"]::placeholder) {
  color: #4b5563 !important;
  opacity: 1 !important;
}

/* Target Nuxt UI input components specifically */
:deep([class*="input"] input::placeholder),
:deep([class*="Input"] input::placeholder) {
  color: #4b5563 !important;
  opacity: 1 !important;
}
</style>


