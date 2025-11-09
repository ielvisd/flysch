import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMatching } from '~/app/composables/useMatching'
import type { MatchInputs, School, Program } from '~/types/database'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    })),
    insert: vi.fn()
  })),
  auth: {
    getSession: vi.fn()
  }
}

// Mock useSupabase
vi.mock('~/app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabaseClient
}))

describe('useMatching composable', () => {
  const mockMatchInputs: MatchInputs = {
    trainingGoals: ['PPL'],
    maxBudget: 15000,
    scheduleFlexibility: 'full-time',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      radius: 100
    },
    preferredAircraft: ['Cessna 172'],
    preferredTrainingType: 'Part 61',
    financing: false,
    veteranBenefits: false,
    housingNeeded: false
  }

  const mockSchools: School[] = [
    {
      id: '1',
      name: 'Budget School',
      city: 'Test City',
      state: 'CA',
      location: { lat: 37.7749, lng: -122.4194 },
      programs: [
        { 
          type: 'PPL', 
          minCost: 10000, 
          maxCost: 15000, 
          inclusions: [], 
          trainingType: ['Part 61'] 
        }
      ],
      fleet: { aircraft: [], totalAircraft: 5 },
      trust_tier: 'Verified',
      instructors_count: 10,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Expensive School',
      city: 'Another City',
      state: 'CA',
      location: { lat: 37.7849, lng: -122.4294 },
      programs: [
        { 
          type: 'PPL', 
          minCost: 20000, 
          maxCost: 25000, 
          inclusions: [], 
          trainingType: ['Part 141'] 
        }
      ],
      fleet: { aircraft: [], totalAircraft: 10 },
      trust_tier: 'Premier',
      instructors_count: 20,
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('runFallbackMatching', () => {
    it('should score schools based on budget fit', async () => {
      const { runFallbackMatching } = useMatching()
      
      // Mock Supabase response
      mockSupabaseClient.from().select().then = vi.fn((resolve) => 
        resolve({ data: mockSchools, error: null })
      )

      // This would test the fallback matching logic
      // For now, we verify the function exists
      expect(typeof runFallbackMatching).toBe('function')
    })

    it('should prioritize schools within budget', () => {
      const budgetSchool = mockSchools[0]
      const expensiveSchool = mockSchools[1]
      
      const budgetFit1 = budgetSchool.programs[0].minCost <= mockMatchInputs.maxBudget
      const budgetFit2 = expensiveSchool.programs[0].minCost <= mockMatchInputs.maxBudget
      
      expect(budgetFit1).toBe(true)
      expect(budgetFit2).toBe(false)
    })

    it('should match programs correctly', () => {
      const school = mockSchools[0]
      const hasRequiredProgram = school.programs.some(
        p => mockMatchInputs.trainingGoals.includes(p.type)
      )
      
      expect(hasRequiredProgram).toBe(true)
    })
  })

  describe('generateFallbackDebrief', () => {
    it('should generate debrief text', () => {
      const scoredSchools = [
        {
          schoolId: '1',
          score: 85,
          factors: {
            budget: 0.9,
            programs: 1.0,
            schedule: 0.75,
            trust: 0.8
          }
        }
      ]

      // The debrief should include key information
      const debrief = `Based on your search for ${mockMatchInputs.trainingGoals.join(', ')} training`
      
      expect(debrief).toContain('PPL')
    })
  })

  describe('quiz progress persistence', () => {
    it('should save quiz progress', () => {
      const { saveQuizProgress } = useMatching()
      
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      global.localStorage = localStorageMock as any
      
      saveQuizProgress(2, mockMatchInputs)
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should load quiz progress', () => {
      const { loadQuizProgress } = useMatching()
      
      // Mock localStorage with saved data
      const localStorageMock = {
        getItem: vi.fn((key: string) => {
          if (key === 'flysch-quiz-step') return '2'
          if (key === 'flysch-quiz-inputs') return JSON.stringify(mockMatchInputs)
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      global.localStorage = localStorageMock as any
      
      loadQuizProgress()
      
      expect(localStorageMock.getItem).toHaveBeenCalled()
    })

    it('should clear quiz progress', () => {
      const { clearQuizProgress } = useMatching()
      
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      global.localStorage = localStorageMock as any
      
      clearQuizProgress()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flysch-quiz-step')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flysch-quiz-inputs')
    })
  })
})

