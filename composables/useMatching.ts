import type { MatchInputs, MatchSession, School, Program, TrustTier } from '~~/types/database'
import { useSupabase } from './useSupabase'

/**
 * Composable for AI-powered school matching
 */
export const useMatching = () => {
  const toast = useToast()
  
  // Lazy initialization of Supabase client (client-side only)
  const getSupabase = () => {
    if (process.server) {
      throw new Error('Supabase operations must be performed on the client-side')
    }
    return useSupabase()
  }

  // Global state for match results
  const matchResults = useState<MatchSession | null>('match-results', () => null)
  const matchLoading = useState<boolean>('match-loading', () => false)
  const matchError = useState<{ message: string; code?: string } | null>('match-error', () => null)

  // Quiz state for persistence
  const quizInputs = useState<Partial<MatchInputs>>('quiz-inputs', () => ({}))
  const currentStep = useState<number>('quiz-step', () => 1)

  /**
   * Run AI matching algorithm
   */
  const runMatching = async (inputs: MatchInputs): Promise<MatchSession | null> => {
    matchLoading.value = true
    matchError.value = null

    try {
      // Call server API for matching
      const result = await $fetch<MatchSession>('/api/match', {
        method: 'POST',
        body: inputs
      })

      matchResults.value = result
      
      // Save to Supabase (client-side only)
      if (process.client) {
        const supabase = getSupabase()
        const { error: saveError } = await supabase
          .from('match_sessions')
          .insert({
          inputs,
          ranked_schools: result.ranked_schools,
          match_scores: result.match_scores,
          debrief: result.debrief,
          completed_at: new Date().toISOString()
        })

        if (saveError) {
          console.error('Error saving match session:', saveError)
        }
      }

      toast.add({
        title: 'Match Complete!',
        description: `Found ${result.ranked_schools.length} schools matching your criteria`,
        color: 'success'
      })

      return result

    } catch (err) {
      console.error('Matching error:', err)
      matchError.value = {
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        code: err instanceof Error && 'code' in err ? String(err.code) : undefined
      }
      
      toast.add({
        title: 'Matching Failed',
        description: 'Could not complete matching. Please try again.',
        color: 'error'
      })

      // Fallback to rule-based matching
      return runFallbackMatching(inputs)
    } finally {
      matchLoading.value = false
    }
  }

  /**
   * Fallback rule-based matching if AI fails
   */
  const runFallbackMatching = async (inputs: MatchInputs): Promise<MatchSession | null> => {
    if (process.server) {
      console.warn('Fallback matching cannot run on server-side')
      return null
    }
    
    try {
      // Get candidate schools from Supabase
      const supabase = getSupabase()
      const { data: schools, error } = await supabase
        .from('schools')
        .select('*')

      if (error) throw error

      if (!schools || schools.length === 0) {
        return null
      }

      // Score schools based on criteria
      const scoredSchools = schools.map((school: School) => {
        let score = 0
        const factors: Record<string, number> = {}

        // Budget fit (40% weight)
        const schoolMinCost = Math.min(...(school.programs?.map((p: Program) => p.minCost) || [Infinity]))
        const schoolMaxCost = Math.max(...(school.programs?.map((p: Program) => p.maxCost) || [0]))
        
        if (schoolMinCost <= inputs.maxBudget) {
          factors.budget = Math.min(1, inputs.maxBudget / schoolMaxCost)
          score += factors.budget * 0.4
        }

        // Program goals match (30% weight)
        const hasAllPrograms = inputs.trainingGoals.every(goal =>
          school.programs?.some((p: Program) => p.type === goal)
        )
        factors.programs = hasAllPrograms ? 1 : 0.5
        score += factors.programs * 0.3

        // Schedule flexibility (15% weight)
        factors.schedule = 0.75 // Simplified scoring
        score += factors.schedule * 0.15

        // Trust tier bonus (15% weight)
        const tierScores: Record<TrustTier, number> = { Premier: 1, Verified: 0.8, Community: 0.5, Unverified: 0.3 }
        factors.trust = tierScores[school.trust_tier as TrustTier] || 0.3
        score += (factors.trust || 0) * 0.15

        return {
          schoolId: school.id,
          score: Math.round(score * 100),
          factors
        }
      })

      // Sort by score
      scoredSchools.sort((a: { score: number }, b: { score: number }) => b.score - a.score)

      // Take top 10
      const topSchools = scoredSchools.slice(0, 10)

      const result: MatchSession = {
        id: crypto.randomUUID(),
        inputs,
        ranked_schools: topSchools.map((s: { schoolId: string }) => s.schoolId),
        match_scores: topSchools.reduce((acc: Record<string, number>, s: { schoolId: string; score: number }) => {
          acc[s.schoolId] = s.score
          return acc
        }, {} as Record<string, number>),
        debrief: generateFallbackDebrief(topSchools, inputs),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        session_data: {}
      }

      matchResults.value = result
      return result

    } catch (err) {
      console.error('Fallback matching error:', err)
      return null
    }
  }

  /**
   * Generate fallback debrief text
   */
  const generateFallbackDebrief = (scoredSchools: any[], inputs: MatchInputs): string => {
    const topSchool = scoredSchools[0]
    const programsStr = inputs.trainingGoals.join(', ')

    return `Based on your search for ${programsStr} training with a budget of $${inputs.maxBudget.toLocaleString()}, we found ${scoredSchools.length} matching schools.

Your top match scored ${topSchool.score}% based on:
- Budget compatibility (${Math.round(topSchool.factors.budget * 100)}%)
- Program offerings (${Math.round(topSchool.factors.programs * 100)}%)
- Trust tier rating (${Math.round(topSchool.factors.trust * 100)}%)

Consider visiting the top 3-5 schools to compare facilities, meet instructors, and assess the learning environment. Location and schedule flexibility will also play important roles in your final decision.`
  }

  /**
   * Save quiz progress
   */
  const saveQuizProgress = (step: number, data: Partial<MatchInputs>) => {
    currentStep.value = step
    quizInputs.value = { ...quizInputs.value, ...data }
    
    // Also save to localStorage for persistence
    if (process.client) {
      localStorage.setItem('flysch-quiz-step', step.toString())
      localStorage.setItem('flysch-quiz-inputs', JSON.stringify(quizInputs.value))
    }
  }

  /**
   * Load quiz progress
   */
  const loadQuizProgress = () => {
    if (process.client) {
      const savedStep = localStorage.getItem('flysch-quiz-step')
      const savedInputs = localStorage.getItem('flysch-quiz-inputs')
      
      if (savedStep) {
        currentStep.value = parseInt(savedStep)
      }
      
      if (savedInputs) {
        try {
          quizInputs.value = JSON.parse(savedInputs)
        } catch (e) {
          console.error('Error loading quiz progress:', e)
        }
      }
    }
  }

  /**
   * Clear quiz progress
   */
  const clearQuizProgress = () => {
    currentStep.value = 1
    quizInputs.value = {}
    matchResults.value = null
    
    if (process.client) {
      localStorage.removeItem('flysch-quiz-step')
      localStorage.removeItem('flysch-quiz-inputs')
    }
  }

  /**
   * Get previous match sessions
   */
  const getMatchHistory = async (userId?: string): Promise<MatchSession[]> => {
    if (process.server) {
      console.warn('getMatchHistory cannot run on server-side')
      return []
    }
    
    try {
      const supabase = getSupabase()
      let query = supabase
        .from('match_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Error fetching match history:', err)
      return []
    }
  }

  return {
    // State
    matchResults: computed(() => matchResults.value),
    matchLoading: computed(() => matchLoading.value),
    matchError: computed(() => matchError.value),
    quizInputs: computed(() => quizInputs.value),
    currentStep: computed(() => currentStep.value),

    // Methods
    runMatching,
    runFallbackMatching,
    saveQuizProgress,
    loadQuizProgress,
    clearQuizProgress,
    getMatchHistory
  }
}

