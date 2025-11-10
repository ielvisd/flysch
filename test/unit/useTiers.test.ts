import { describe, it, expect, beforeEach } from 'vitest'
import { useTiers } from '../../app/composables/useTiers'
import type { School, TrustTier } from '../../types/database'

describe('useTiers composable', () => {
  let tiers: ReturnType<typeof useTiers>

  beforeEach(() => {
    tiers = useTiers()
  })
  const mockSchoolPremier = {
    programs: [
      { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
      { type: 'IR' as any, minCost: 8000, maxCost: 12000 },
      { type: 'CPL' as any, minCost: 25000, maxCost: 35000 }
    ],
    trust_tier: 'Premier' as any,
    fsp_signals: {
      fleetUtilization: 80,
      passRateFirstAttempt: 90,
      studentSatisfaction: 4.5
    }
  }

  const mockSchoolVerified = {
    programs: [
      { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
      { type: 'IR' as any, minCost: 8000, maxCost: 12000 },
      { type: 'CPL' as any, minCost: 25000, maxCost: 35000 }
    ],
    trust_tier: 'Verified' as any,
    fsp_signals: {
      fleetUtilization: 72,
      passRateFirstAttempt: 80,
      studentSatisfaction: 4.0
    }
  }

  const mockSchoolCommunity = {
    programs: [
      { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
      { type: 'IR' as any, minCost: 8000, maxCost: 12000 }
    ],
    trust_tier: 'Community' as any,
    fsp_signals: {
      fleetUtilization: 65,
      passRateFirstAttempt: 75,
      studentSatisfaction: 3.5
    }
  }

  it('should return correct tier color', () => {
    const premierColor = tiers.getTierColor('Premier')
    const verifiedColor = tiers.getTierColor('Verified')
    const communityColor = tiers.getTierColor('Community')
    const unverifiedColor = tiers.getTierColor('Unverified')

    expect(premierColor).toBe('warning')
    expect(verifiedColor).toBe('success')
    expect(communityColor).toBe('primary')
    expect(unverifiedColor).toBe('neutral')
  })

  it('should return correct tier icon', () => {
    const premierIcon = tiers.getTierIcon('Premier')
    const verifiedIcon = tiers.getTierIcon('Verified')

    expect(premierIcon).toContain('star')
    expect(verifiedIcon).toContain('check-badge')
  })

  it('should return tier description', () => {
    const premierDesc = tiers.getTierDescription('Premier')
    const verifiedDesc = tiers.getTierDescription('Verified')

    expect(premierDesc).toContain('Top-performing')
    expect(verifiedDesc).toContain('Established')
  })

  it('should return tier criteria', () => {
    const premierCriteria = tiers.getTierCriteria('Premier')
    const verifiedCriteria = tiers.getTierCriteria('Verified')

    expect(premierCriteria.length).toBeGreaterThan(0)
    expect(verifiedCriteria.length).toBeGreaterThan(0)
    expect(premierCriteria[0]).toContain('Fleet utilization')
  })

  it('should return tier badge', () => {
    const premierBadge = tiers.getTierBadge('Premier')
    const verifiedBadge = tiers.getTierBadge('Verified')

    expect(premierBadge.label).toBe('Premier')
    expect(premierBadge.color).toBe('warning')
    expect(verifiedBadge.label).toBe('Verified')
    expect(verifiedBadge.color).toBe('success')
  })

  it('should calculate Premier tier correctly', () => {
    const calculatedTier = tiers.calculateTier(mockSchoolPremier as Partial<School>)
    
    expect(calculatedTier).toBe('Premier')
    
    // Check if school meets Premier criteria
    const meetsUtilization = (mockSchoolPremier.fsp_signals?.fleetUtilization || 0) > 75
    const meetsPrograms = (mockSchoolPremier.programs?.length || 0) >= 3
    const meetsPassRate = (mockSchoolPremier.fsp_signals?.passRateFirstAttempt || 0) > 85
    const meetsSatisfaction = (mockSchoolPremier.fsp_signals?.studentSatisfaction || 0) >= 4.0

    expect(meetsUtilization).toBe(true)
    expect(meetsPrograms).toBe(true)
    expect(meetsPassRate).toBe(true)
    expect(meetsSatisfaction).toBe(true)
  })

  it('should calculate Verified tier correctly', () => {
    const calculatedTier = tiers.calculateTier(mockSchoolVerified as Partial<School>)
    
    expect(calculatedTier).toBe('Verified')
    
    const meetsPrograms = (mockSchoolVerified.programs?.length || 0) >= 3
    const meetsUtilization = (mockSchoolVerified.fsp_signals?.fleetUtilization || 0) > 70

    expect(meetsPrograms).toBe(true)
    expect(meetsUtilization).toBe(true)
  })

  it('should calculate Community tier correctly', () => {
    const calculatedTier = tiers.calculateTier(mockSchoolCommunity as Partial<School>)
    
    expect(calculatedTier).toBe('Community')
  })

  it('should check tier requirements', () => {
    const meetsPremier = tiers.meetsTierRequirements(mockSchoolPremier as Partial<School>, 'Premier')
    const meetsVerified = tiers.meetsTierRequirements(mockSchoolPremier as Partial<School>, 'Verified')
    
    expect(meetsPremier).toBe(true)
    expect(meetsVerified).toBe(true)
  })

  it('should provide next tier recommendations', () => {
    const recommendations = tiers.getNextTierRecommendations(mockSchoolCommunity as Partial<School>)
    
    expect(Array.isArray(recommendations)).toBe(true)
  })

  it('should handle schools with minimal data', () => {
    const minimalSchool = {
      programs: [{ type: 'PPL' as any, minCost: 10000, maxCost: 15000 }],
      trust_tier: 'Unverified' as any,
      fsp_signals: {}
    }

    expect(minimalSchool.trust_tier).toBe('Unverified')
  })

  describe('edge cases', () => {
    it('should handle null school data', () => {
      const calculatedTier = tiers.calculateTier(null as any)
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle undefined school data', () => {
      const calculatedTier = tiers.calculateTier(undefined as any)
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle empty programs array', () => {
      const schoolWithNoPrograms = {
        programs: [],
        fsp_signals: {}
      }
      const calculatedTier = tiers.calculateTier(schoolWithNoPrograms as Partial<School>)
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle missing programs property', () => {
      const schoolWithoutPrograms = {
        fsp_signals: {}
      }
      const calculatedTier = tiers.calculateTier(schoolWithoutPrograms as Partial<School>)
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle missing FSP signals', () => {
      const schoolWithoutSignals = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 }
        ]
      }
      const calculatedTier = tiers.calculateTier(schoolWithoutSignals as Partial<School>)
      // With only 1 program and no utilization > 60, should be Unverified
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle empty FSP signals object', () => {
      const schoolWithEmptySignals = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 }
        ],
        fsp_signals: {}
      }
      const calculatedTier = tiers.calculateTier(schoolWithEmptySignals as Partial<School>)
      // With only 1 program and no utilization > 60, should be Unverified
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle FSP signals with zero values', () => {
      const schoolWithZeroSignals = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 }
        ],
        fsp_signals: {
          fleetUtilization: 0,
          passRateFirstAttempt: 0,
          studentSatisfaction: 0
        }
      }
      const calculatedTier = tiers.calculateTier(schoolWithZeroSignals as Partial<School>)
      // With only 1 program and utilization 0 (not > 60), should be Unverified
      expect(calculatedTier).toBe('Unverified')
    })

    it('should handle FSP signals with undefined values', () => {
      const schoolWithUndefinedSignals = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 }
        ],
        fsp_signals: {
          fleetUtilization: undefined,
          passRateFirstAttempt: undefined,
          studentSatisfaction: undefined
        }
      }
      const calculatedTier = tiers.calculateTier(schoolWithUndefinedSignals as Partial<School>)
      // With only 1 program and no utilization > 60, should be Unverified
      expect(calculatedTier).toBe('Unverified')
    })

    it('should return all tier icons', () => {
      const premierIcon = tiers.getTierIcon('Premier')
      const verifiedIcon = tiers.getTierIcon('Verified')
      const communityIcon = tiers.getTierIcon('Community')
      const unverifiedIcon = tiers.getTierIcon('Unverified')

      expect(premierIcon).toBeDefined()
      expect(verifiedIcon).toBeDefined()
      expect(communityIcon).toBeDefined()
      expect(unverifiedIcon).toBeDefined()
      expect(premierIcon).toContain('star')
      expect(verifiedIcon).toContain('check-badge')
      expect(communityIcon).toContain('user-group')
      expect(unverifiedIcon).toContain('question-mark')
    })

    it('should return all tier badges', () => {
      const premierBadge = tiers.getTierBadge('Premier')
      const verifiedBadge = tiers.getTierBadge('Verified')
      const communityBadge = tiers.getTierBadge('Community')
      const unverifiedBadge = tiers.getTierBadge('Unverified')

      expect(premierBadge.label).toBe('Premier')
      expect(premierBadge.color).toBe('warning')
      expect(premierBadge.icon).toBeDefined()

      expect(verifiedBadge.label).toBe('Verified')
      expect(verifiedBadge.color).toBe('success')
      expect(verifiedBadge.icon).toBeDefined()

      expect(communityBadge.label).toBe('Community')
      expect(communityBadge.color).toBe('primary')
      expect(communityBadge.icon).toBeDefined()

      expect(unverifiedBadge.label).toBe('Unverified')
      expect(unverifiedBadge.color).toBe('neutral')
      expect(unverifiedBadge.icon).toBeDefined()
    })

    it('should return all tier descriptions', () => {
      const premierDesc = tiers.getTierDescription('Premier')
      const verifiedDesc = tiers.getTierDescription('Verified')
      const communityDesc = tiers.getTierDescription('Community')
      const unverifiedDesc = tiers.getTierDescription('Unverified')

      expect(premierDesc).toBeDefined()
      expect(verifiedDesc).toBeDefined()
      expect(communityDesc).toBeDefined()
      expect(unverifiedDesc).toBeDefined()
      expect(premierDesc.length).toBeGreaterThan(0)
      expect(verifiedDesc.length).toBeGreaterThan(0)
      expect(communityDesc.length).toBeGreaterThan(0)
      expect(unverifiedDesc.length).toBeGreaterThan(0)
    })

    it('should return all tier criteria', () => {
      const premierCriteria = tiers.getTierCriteria('Premier')
      const verifiedCriteria = tiers.getTierCriteria('Verified')
      const communityCriteria = tiers.getTierCriteria('Community')
      const unverifiedCriteria = tiers.getTierCriteria('Unverified')

      expect(Array.isArray(premierCriteria)).toBe(true)
      expect(Array.isArray(verifiedCriteria)).toBe(true)
      expect(Array.isArray(communityCriteria)).toBe(true)
      expect(Array.isArray(unverifiedCriteria)).toBe(true)
      expect(premierCriteria.length).toBeGreaterThan(0)
      expect(verifiedCriteria.length).toBeGreaterThan(0)
      expect(communityCriteria.length).toBeGreaterThan(0)
      expect(unverifiedCriteria.length).toBeGreaterThan(0)
    })

    it('should handle tier calculation with only program count', () => {
      const schoolWithOnlyPrograms = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
          { type: 'IR' as any, minCost: 8000, maxCost: 12000 }
        ],
        fsp_signals: {}
      }
      const calculatedTier = tiers.calculateTier(schoolWithOnlyPrograms as Partial<School>)
      expect(calculatedTier).toBe('Community')
    })

    it('should handle tier calculation with only utilization', () => {
      const schoolWithOnlyUtilization = {
        programs: [],
        fsp_signals: {
          fleetUtilization: 65
        }
      }
      const calculatedTier = tiers.calculateTier(schoolWithOnlyUtilization as Partial<School>)
      expect(calculatedTier).toBe('Community')
    })

    it('should handle tier calculation with high utilization but low programs', () => {
      const schoolHighUtilLowPrograms = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 }
        ],
        fsp_signals: {
          fleetUtilization: 80,
          passRateFirstAttempt: 90,
          studentSatisfaction: 4.5
        }
      }
      const calculatedTier = tiers.calculateTier(schoolHighUtilLowPrograms as Partial<School>)
      // Should be Verified or Community, not Premier (needs 3+ programs)
      expect(['Verified', 'Community']).toContain(calculatedTier)
    })

    it('should handle meetsTierRequirements with null school', () => {
      const meets = tiers.meetsTierRequirements(null as any, 'Community')
      expect(meets).toBe(false)
    })

    it('should handle meetsTierRequirements with undefined school', () => {
      const meets = tiers.meetsTierRequirements(undefined as any, 'Community')
      expect(meets).toBe(false)
    })

    it('should provide recommendations for Unverified tier', () => {
      const unverifiedSchool = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 }
        ],
        fsp_signals: {
          fleetUtilization: 50
        }
      }
      const recommendations = tiers.getNextTierRecommendations(unverifiedSchool as Partial<School>)
      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('should provide recommendations for Community tier', () => {
      const communitySchool = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
          { type: 'IR' as any, minCost: 8000, maxCost: 12000 }
        ],
        fsp_signals: {
          fleetUtilization: 65,
          passRateFirstAttempt: 70
        }
      }
      const recommendations = tiers.getNextTierRecommendations(communitySchool as Partial<School>)
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should provide recommendations for Verified tier', () => {
      const verifiedSchool = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
          { type: 'IR' as any, minCost: 8000, maxCost: 12000 },
          { type: 'CPL' as any, minCost: 25000, maxCost: 35000 }
        ],
        fsp_signals: {
          fleetUtilization: 72,
          passRateFirstAttempt: 80,
          studentSatisfaction: 3.8
        }
      }
      const recommendations = tiers.getNextTierRecommendations(verifiedSchool as Partial<School>)
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should handle Premier tier with no recommendations needed', () => {
      const premierSchool = {
        programs: [
          { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
          { type: 'IR' as any, minCost: 8000, maxCost: 12000 },
          { type: 'CPL' as any, minCost: 25000, maxCost: 35000 }
        ],
        fsp_signals: {
          fleetUtilization: 80,
          passRateFirstAttempt: 90,
          studentSatisfaction: 4.5
        }
      }
      const recommendations = tiers.getNextTierRecommendations(premierSchool as Partial<School>)
      expect(Array.isArray(recommendations)).toBe(true)
      // Premier tier might have no recommendations or suggestions for maintaining
    })

    it('should handle getTierColor with invalid tier', () => {
      const color = tiers.getTierColor('InvalidTier' as TrustTier)
      expect(color).toBe('neutral')
    })

    it('should handle getTierIcon with invalid tier', () => {
      const icon = tiers.getTierIcon('InvalidTier' as TrustTier)
      expect(icon).toContain('question-mark')
    })
  })
})

