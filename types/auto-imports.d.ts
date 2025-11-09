// Auto-imported composables type declarations
// These help TypeScript recognize Nuxt's auto-imported composables

import type { School, SchoolFilters } from '~~/types/database'
import type { MatchInputs, MatchSession } from '~~/types/database'
import type { TrustTier } from '~~/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

declare global {
  // Composables from composables/ directory
  function useSupabase(): SupabaseClient
  
  function useSchools(): {
    schools: import('vue').ComputedRef<School[]>
    loading: import('vue').ComputedRef<boolean>
    error: import('vue').ComputedRef<Error | null>
    fetchSchools: (filters?: SchoolFilters) => Promise<School[]>
    fetchSchool: (id: string) => Promise<School | null>
    searchSchools: (query: string) => Promise<School[]>
    subscribeToSchool: (schoolId: string, callback: (school: School) => void) => () => void
    clearCache: () => void
  }
  
  function useMatching(): {
    matchResults: import('vue').ComputedRef<MatchSession | null>
    matchLoading: import('vue').ComputedRef<boolean>
    matchError: import('vue').ComputedRef<Error | null>
    quizInputs: import('vue').ComputedRef<Partial<MatchInputs>>
    currentStep: import('vue').ComputedRef<number>
    runMatching: (inputs: MatchInputs) => Promise<MatchSession | null>
    saveQuizProgress: (step: number, data: Partial<MatchInputs>) => void
    loadQuizProgress: () => void
    clearQuizProgress: () => void
    getMatchHistory: (userId?: string) => Promise<MatchSession[]>
  }
  
  function useTiers(): {
    calculateTier: (school: Partial<School>) => TrustTier
    getTierColor: (tier: TrustTier) => string
    getTierIcon: (tier: TrustTier) => string
    getTierDescription: (tier: TrustTier) => string
    getTierCriteria: (tier: TrustTier) => string[]
    getTierBadge: (tier: TrustTier) => { label: string; color: string; icon: string }
    meetsTierRequirements: (school: Partial<School>, targetTier: TrustTier) => boolean
    getNextTierRecommendations: (school: Partial<School>) => string[]
  }
}

export {}

