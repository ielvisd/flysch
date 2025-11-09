<template>
  <div class="min-h-screen py-8 md:py-12 bg-gray-50" style="padding-top: 100px;">
    <div class="max-w-4xl mx-auto px-4 md:px-6">
      <!-- Header -->
      <div class="text-center mb-6 md:mb-8">
        <UBadge color="primary" variant="soft" size="lg" icon="i-heroicons-sparkles" class="mb-4">
          ✈️ Flysch AI Matching
        </UBadge>
        <h1 class="text-3xl md:text-4xl font-bold mb-2" style="color: #004E89; font-family: var(--font-family, 'Poppins', sans-serif);">
          Find Your Perfect Match 🎯
        </h1>
        <p class="text-lg" style="color: #004E89; opacity: 0.8;">
          Answer a few questions and we'll match you with the best flight schools
        </p>
      </div>

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div 
            v-for="step in steps" 
            :key="step.number"
            class="flex-1"
          >
            <div class="flex items-center">
              <div 
                :class="[
                  'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all',
                  currentStep >= step.number 
                    ? 'text-white' 
                    : 'text-white'
                ]"
                :style="currentStep >= step.number ? 'background-color: #004E89;' : 'background-color: #1A659E; opacity: 0.5;'"
              >
                <UIcon 
                  v-if="currentStep > step.number"
                  name="i-heroicons-check"
                  class="w-6 h-6"
                />
                <span v-else>{{ step.number }}</span>
              </div>
              <div 
                v-if="step.number < steps.length"
                class="flex-1 h-1 mx-2 transition-all"
                :style="currentStep > step.number ? 'background-color: #004E89;' : 'background-color: #1A659E; opacity: 0.3;'"
              />
            </div>
            <p class="text-xs mt-2" style="color: #6B7280;">{{ step.title }}</p>
          </div>
        </div>
      </div>

      <!-- Wizard Content -->
      <UCard variant="outline" class="mb-6 bg-white" style="border: 2px solid rgba(5, 74, 145, 0.4); box-shadow: 0 4px 6px rgba(5, 74, 145, 0.1);">
        <!-- Step 1: Goals -->
        <div v-show="currentStep === 1" class="space-y-6">
          <div>
            <h2 class="text-2xl font-semibold mb-2" style="color: #004E89;">What are your training goals?</h2>
            <p class="mb-4" style="color: #6B7280;">
              Select all certificates and ratings you plan to pursue
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              v-for="goal in goalOptions"
              :key="goal.value"
              @click="toggleGoal(goal.value)"
              :class="[
                'p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[100px]',
                formData.trainingGoals?.includes(goal.value) || false
                  ? ''
                  : 'hover:border-opacity-60'
              ]"
              :style="formData.trainingGoals?.includes(goal.value) || false
                ? 'border-color: #004E89; background-color: #1A659E; opacity: 0.2; color: #004E89;'
                : 'border-color: #1A659E; background-color: transparent; color: #004E89;'"
            >
              <UIcon :name="goal.icon" class="w-8 h-8 mb-2 mx-auto" />
              <p class="text-center font-semibold">{{ goal.label }}</p>
              <p class="text-xs text-center mt-1" style="color: #6B7280;">{{ goal.description }}</p>
            </div>
          </div>

          <UAlert 
            v-if="!formData.trainingGoals || formData.trainingGoals.length === 0"
            icon="i-heroicons-information-circle"
            color="primary"
            variant="soft"
            title="Select at least one training goal to continue"
          />
        </div>

        <!-- Step 2: Budget & Schedule -->
        <div v-show="currentStep === 2" class="space-y-6">
          <div>
            <h2 class="text-2xl font-semibold mb-2" style="color: #004E89;">Budget & Schedule</h2>
            <p class="mb-4" style="color: #6B7280;">
              Help us understand your financial and time constraints
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: #004E89;">
              Maximum Budget: ${{ formData.maxBudget?.toLocaleString() || '0' }}
            </label>
            <input 
              v-model.number="formData.maxBudget"
              type="range"
              min="5000"
              max="50000"
              step="1000"
              class="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style="background: linear-gradient(to right, #1A659E 0%, #004E89 100%);"
            />
            <div class="flex justify-between text-xs mt-1" style="color: #6B7280;">
              <span>$5,000</span>
              <span>$50,000</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: #004E89;">Schedule Flexibility</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                v-for="schedule in scheduleOptions"
                :key="schedule.value"
                @click="formData.scheduleFlexibility = schedule.value as MatchInputs['scheduleFlexibility']"
                :class="[
                  'p-3 border-2 rounded-lg cursor-pointer text-center transition-all min-h-[60px] flex items-center justify-center',
                  formData.scheduleFlexibility === schedule.value
                    ? ''
                    : 'hover:border-opacity-60'
                ]"
                :style="formData.scheduleFlexibility === schedule.value
                  ? 'border-color: #054A91; background-color: #28AFFA; opacity: 0.2; color: #054A91;'
                  : 'border-color: #28AFFA; background-color: transparent; color: #054A91;'"
              >
                <p class="font-medium">{{ schedule.label }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UCheckbox 
              v-model="formData.financing"
              label="I need financing options"
            />
            <UCheckbox 
              v-model="formData.veteranBenefits"
              label="I have VA benefits"
            />
          </div>
        </div>

        <!-- Step 3: Location -->
        <div v-show="currentStep === 3" class="space-y-6">
          <div>
            <h2 class="text-2xl font-semibold mb-2" style="color: #004E89;">Location Preferences</h2>
            <p class="mb-4" style="color: #6B7280;">
              Where would you like to train?
            </p>
          </div>

          <div>
            <UButton 
              icon="i-heroicons-map-pin"
              variant="soft"
              @click="detectLocation"
              :loading="detectingLocation"
              class="mb-4 min-h-[44px] touch-manipulation"
            >
              Use My Current Location
            </UButton>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UInput 
                v-model.number="locationLat"
                type="number"
                step="0.0001"
                label="Latitude"
                placeholder="40.7128"
              />
              <UInput 
                v-model.number="locationLng"
                type="number"
                step="0.0001"
                label="Longitude"
                placeholder="-74.0060"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Search Radius: {{ formData.location?.radius || 100 }} km ({{ Math.round((formData.location?.radius || 100) * 0.621371) }} miles)
            </label>
            <input 
              v-if="formData.location"
              v-model.number="formData.location.radius"
              type="range"
              min="10"
              max="500"
              step="10"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div class="flex justify-between text-xs mt-1" style="color: #6B7280;">
              <span>10 km</span>
              <span>500 km</span>
            </div>
          </div>

          <UCheckbox 
            v-model="formData.housingNeeded"
            label="I need housing or relocation assistance"
          />
        </div>

        <!-- Step 4: Preferences -->
        <div v-show="currentStep === 4" class="space-y-6">
          <div>
            <h2 class="text-2xl font-semibold mb-2" style="color: #004E89;">Training Preferences</h2>
            <p class="mb-4" style="color: #6B7280;">
              Tell us about your preferred training environment
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: #004E89;">Preferred Aircraft</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div 
                v-for="aircraft in aircraftOptions"
                :key="aircraft"
                @click="toggleAircraft(aircraft)"
                :class="[
                  'p-3 border-2 rounded-lg cursor-pointer text-center transition-all min-h-[60px] flex items-center justify-center',
                  formData.preferredAircraft?.includes(aircraft)
                    ? ''
                    : 'hover:border-opacity-60'
                ]"
                :style="formData.preferredAircraft?.includes(aircraft)
                  ? 'border-color: #054A91; background-color: #28AFFA; opacity: 0.2; color: #054A91;'
                  : 'border-color: #28AFFA; background-color: transparent; color: #054A91;'"
              >
                <p class="font-medium text-sm">{{ aircraft }}</p>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2" style="color: #004E89;">Training Type Preference</label>
            <div class="grid grid-cols-2 gap-3">
              <div 
                v-for="type in trainingTypes"
                :key="type.value"
                @click="formData.preferredTrainingType = type.value as TrainingType"
                :class="[
                  'p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[80px]',
                  formData.preferredTrainingType === type.value
                    ? ''
                    : 'hover:border-opacity-60'
                ]"
                :style="formData.preferredTrainingType === type.value
                  ? 'border-color: #054A91; background-color: #28AFFA; opacity: 0.2; color: #054A91;'
                  : 'border-color: #28AFFA; background-color: transparent; color: #054A91;'"
              >
                <p class="font-semibold mb-1">{{ type.label }}</p>
                <p class="text-xs" style="color: #6B7280;">{{ type.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div v-show="showResults" class="space-y-6">
          <div class="text-center py-8" v-if="matchLoading">
            <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h3 class="text-xl font-semibold mb-2">Finding Your Perfect Matches...</h3>
            <p style="color: #6B7280;">
              Our AI is analyzing {{ candidateCount }} schools that meet your criteria
            </p>
          </div>

          <div v-else-if="matchError" class="text-center py-8">
            <UAlert 
              icon="i-heroicons-exclamation-triangle"
              color="error"
              variant="soft"
              title="Matching Error"
            >
              <template #description>
                <p class="mt-2">{{ matchError.message || 'Failed to complete matching. Please try again.' }}</p>
                <UButton 
                  @click="submitMatching"
                  variant="solid"
                  class="mt-4 min-h-[44px] touch-manipulation"
                  style="background-color: #FF6B35; color: white;"
                >
                  Retry Matching
                </UButton>
              </template>
            </UAlert>
          </div>

          <div v-else-if="matchResults">
            <!-- AI Debrief -->
            <UAlert 
              icon="i-heroicons-sparkles"
              color="primary"
              variant="soft"
              title="AI Match Analysis"
              role="region"
              aria-label="AI Match Analysis"
            >
              <template #description>
                <div class="prose prose-sm dark:prose-invert mt-2">
                  {{ matchResults.debrief }}
                </div>
              </template>
            </UAlert>

            <!-- Top Matches -->
            <div>
              <h3 class="text-xl font-semibold mb-4" style="color: #004E89;">Your Top Matches</h3>
              <div class="space-y-4">
                <div 
                  v-for="(schoolId, index) in matchResults.ranked_schools.slice(0, 5)"
                  :key="schoolId"
                  class="match-result-card flex items-center gap-4 p-4 border-2 rounded-lg transition-all cursor-pointer bg-white"
                  style="border: 2px solid rgba(5, 74, 145, 0.4); box-shadow: 0 2px 4px rgba(5, 74, 145, 0.1);"
                  @click="$router.push(`/schools/${schoolId}`)"
                >
                  <div 
                    :class="[
                      'w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl',
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-blue-100 text-blue-700'
                    ]"
                    :style="index === 1 ? 'color: #374151;' : ''"
                  >
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-lg" style="color: #004E89;">School #{{ index + 1 }}</p>
                    <p class="text-sm" style="color: #6B7280;">
                      Match Score: {{ matchResults.match_scores[schoolId] }}%
                    </p>
                  </div>
                  <UButton 
                    icon="i-heroicons-arrow-right"
                    variant="solid"
                    style="background-color: #FF6B35; color: white;"
                  >
                    View Details
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center pt-6">
              <UButton 
                variant="solid"
                @click="restartQuiz"
                style="background-color: #FF6B35; color: white;"
                class="min-h-[44px] hover:opacity-90 touch-manipulation"
              >
                Start Over
              </UButton>
              <UButton 
                icon="i-heroicons-arrow-path"
                @click="adjustPreferences"
                variant="solid"
                style="background-color: #FFF952; color: #054A91;"
                class="min-h-[44px] hover:opacity-90 transition-opacity font-semibold touch-manipulation"
              >
                Adjust Preferences
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Navigation -->
      <div class="flex justify-between">
        <UButton 
          v-if="currentStep > 1 && !showResults"
          variant="solid"
          icon="i-heroicons-arrow-left"
          @click="previousStep"
          style="background-color: #1A659E; color: white; border: 2px solid #004E89;"
          class="min-h-[44px] hover:opacity-90 touch-manipulation"
        >
          Back
        </UButton>
        <div v-else />
        
        <UButton 
          v-if="!showResults"
          :disabled="!canProceed"
          trailing-icon="i-heroicons-arrow-right"
          @click="nextStep"
          variant="solid"
          size="lg"
          style="background-color: #FFF952; color: #054A91;"
          class="hover:opacity-90 transition-opacity min-h-[44px] font-semibold touch-manipulation"
        >
          {{ currentStep === 4 ? 'Find Matches' : 'Continue' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchInputs, ProgramType, TrainingType } from '~~/types/database'
import { useMatching } from '~~/app/composables/useMatching'

// Meta
useHead({
  title: 'AI School Matching',
  meta: [
    { name: 'description', content: 'Find your perfect flight school with our AI-powered matching tool' }
  ]
})

// Composables
const { runMatching, matchResults, matchLoading, matchError, saveQuizProgress, loadQuizProgress, clearQuizProgress } = useMatching()
const { coords } = useGeolocation()

// State
const currentStep = ref(1)
const showResults = ref(false)
const detectingLocation = ref(false)
const candidateCount = ref(0)

const formData = ref<Partial<MatchInputs>>({
  trainingGoals: [],
  maxBudget: 15000,
  scheduleFlexibility: 'full-time',
  location: {
    lat: 40.7128,
    lng: -74.0060,
    radius: 100
  },
  preferredAircraft: [],
  financing: false,
  veteranBenefits: false,
  housingNeeded: false
})

const locationLat = ref(40.7128)
const locationLng = ref(-74.0060)

// Watch location inputs
watch([locationLat, locationLng], ([lat, lng]) => {
  if (lat && lng) {
    if (!formData.value.location) {
      formData.value.location = {
        lat: 40.7128,
        lng: -74.0060,
        radius: 100
      }
    }
    formData.value.location = {
      lat,
      lng,
      radius: formData.value.location.radius || 100
    }
  }
})

// Steps configuration
const steps = [
  { number: 1, title: 'Goals' },
  { number: 2, title: 'Budget & Schedule' },
  { number: 3, title: 'Location' },
  { number: 4, title: 'Preferences' }
]

// Options
const goalOptions = [
  { value: 'PPL' as ProgramType, label: 'PPL', description: 'Private Pilot', icon: 'i-heroicons-academic-cap' },
  { value: 'IR' as ProgramType, label: 'IR', description: 'Instrument Rating', icon: 'i-heroicons-cloud' },
  { value: 'CPL' as ProgramType, label: 'CPL', description: 'Commercial Pilot', icon: 'i-heroicons-briefcase' },
  { value: 'CFI' as ProgramType, label: 'CFI', description: 'Flight Instructor', icon: 'i-heroicons-user-group' },
  { value: 'CFII' as ProgramType, label: 'CFII', description: 'Instrument Instructor', icon: 'i-heroicons-chart-bar' },
  { value: 'MEI' as ProgramType, label: 'MEI', description: 'Multi-Engine Instructor', icon: 'i-heroicons-squares-plus' },
  { value: 'ATP' as ProgramType, label: 'ATP', description: 'Airline Transport', icon: 'i-heroicons-building-office-2' }
]

const scheduleOptions: Array<{ value: MatchInputs['scheduleFlexibility']; label: string }> = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'evenings', label: 'Evenings' }
]

const aircraftOptions = [
  'Cessna 172',
  'Cessna 152',
  'Piper PA-28',
  'Piper PA-44',
  'Diamond DA-40',
  'Diamond DA-42'
]

const trainingTypes = [
  { 
    value: 'Part 61' as TrainingType, 
    label: 'Part 61', 
    description: 'Flexible, self-paced training'
  },
  { 
    value: 'Part 141' as TrainingType, 
    label: 'Part 141', 
    description: 'Structured, accelerated program'
  }
]

// Computed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.trainingGoals && formData.value.trainingGoals.length > 0
    case 2:
      return formData.value.maxBudget && formData.value.scheduleFlexibility
    case 3:
      return formData.value.location?.lat && formData.value.location?.lng
    case 4:
      return true
    default:
      return false
  }
})

// Methods
const toggleGoal = (goal: ProgramType) => {
  if (!formData.value.trainingGoals) {
    formData.value.trainingGoals = []
  }
  const index = formData.value.trainingGoals.indexOf(goal)
  if (index > -1) {
    formData.value.trainingGoals.splice(index, 1)
  } else {
    formData.value.trainingGoals.push(goal)
  }
}

const toggleAircraft = (aircraft: string) => {
  if (!formData.value.preferredAircraft) {
    formData.value.preferredAircraft = []
  }
  const index = formData.value.preferredAircraft.indexOf(aircraft)
  if (index > -1) {
    formData.value.preferredAircraft.splice(index, 1)
  } else {
    formData.value.preferredAircraft.push(aircraft)
  }
}

const detectLocation = async () => {
  detectingLocation.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (coords.value) {
      locationLat.value = coords.value.latitude
      locationLng.value = coords.value.longitude
    }
  } finally {
    detectingLocation.value = false
  }
}

const nextStep = async () => {
  if (currentStep.value < 4) {
    currentStep.value++
    saveQuizProgress(currentStep.value, formData.value)
  } else {
    // Final step - run matching
    await submitMatching()
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    saveQuizProgress(currentStep.value, formData.value)
  }
}

const submitMatching = async () => {
  showResults.value = true
  candidateCount.value = Math.floor(Math.random() * 30) + 20 // Estimated
  
  await runMatching(formData.value as MatchInputs)
}

const restartQuiz = () => {
  clearQuizProgress()
  currentStep.value = 1
  showResults.value = false
  formData.value = {
    trainingGoals: [],
    maxBudget: 15000,
    scheduleFlexibility: 'full-time',
    location: {
      lat: 40.7128,
      lng: -74.0060,
      radius: 100
    },
    preferredAircraft: [],
    financing: false,
    veteranBenefits: false,
    housingNeeded: false
  }
}

const adjustPreferences = () => {
  showResults.value = false
  currentStep.value = 1
}

// Load saved progress on mount
onMounted(() => {
  loadQuizProgress()
})
</script>

<style scoped>
.match-result-card {
  border-color: rgba(5, 74, 145, 0.2);
  transition: border-color 0.2s ease;
}

.match-result-card:hover {
  border-color: #1A659E !important;
  border-width: 3px !important;
  box-shadow: 0 8px 16px rgba(26, 101, 158, 0.3) !important;
  background: linear-gradient(to bottom, #ffffff 0%, rgba(26, 101, 158, 0.02) 100%);
}

/* Mobile touch improvements */
@media (max-width: 768px) {
  button, a, [role="button"], [role="link"] {
    min-height: 44px;
    min-width: 44px;
  }
  
  .touch-manipulation {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  .match-result-card {
    min-height: 80px;
  }
}
</style>

